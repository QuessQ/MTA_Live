"""
PhotoFlow UI — CustomTkinter three-tab application.

Tabs: Cull | Style | Export

Falls back to plain tkinter if customtkinter is not installed
(CTK_AVAILABLE flag).
"""

import collections
import json
import logging
import os
import platform
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

from PIL import Image, ImageTk

try:
    import customtkinter as ctk

    CTK_AVAILABLE = True
except ImportError:
    import tkinter as tk
    import tkinter.ttk as ttk

    CTK_AVAILABLE = False

from photoflow.engine import (
    ProcessingPipeline,
    build_style_profile,
    load_image_pil,
    score_image,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config persistence
# ---------------------------------------------------------------------------

_CONFIG_PATH = os.path.expanduser("~/.photoflow_config.json")


def _load_config() -> Dict[str, Any]:
    """Load config from disk. Logs warning on parse errors instead of silently returning {}."""
    if not os.path.isfile(_CONFIG_PATH):
        return {}
    try:
        with open(_CONFIG_PATH, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Failed to parse config %s: %s", _CONFIG_PATH, e)
        return {}


def _save_config(cfg: Dict[str, Any]) -> None:
    try:
        with open(_CONFIG_PATH, "w") as f:
            json.dump(cfg, f, indent=2)
    except OSError as e:
        logger.warning("Failed to save config: %s", e)


# ---------------------------------------------------------------------------
# Thumbnail cache with LRU eviction
# ---------------------------------------------------------------------------

class ThumbnailCache:
    """
    LRU-evicting cache for PhotoImage thumbnails.
    Capped at *maxsize* entries to prevent RAM exhaustion on large shoots.
    """

    def __init__(self, maxsize: int = 300):
        self.maxsize = maxsize
        self._cache: collections.OrderedDict[str, Any] = collections.OrderedDict()

    def get(self, path: str, size: Tuple[int, int] = (160, 160)) -> Any:
        """Return cached PhotoImage or generate + cache it."""
        key = f"{path}:{size[0]}x{size[1]}"
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]

        # Generate thumbnail
        try:
            img = load_image_pil(path)
            img.thumbnail(size, Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)
        except Exception:
            logger.debug("Could not create thumbnail for %s", path)
            return None

        self._cache[key] = photo
        # Evict oldest if over capacity
        while len(self._cache) > self.maxsize:
            self._cache.popitem(last=False)
        return photo

    def clear(self) -> None:
        self._cache.clear()


# ---------------------------------------------------------------------------
# Helper: check if PIL can open a file (with proper close)
# ---------------------------------------------------------------------------

def pil_can_open(path: str) -> bool:
    """Return True if PIL can verify the image. Closes the image after verify."""
    try:
        img = Image.open(path)
        img.verify()
        img.close()
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Supported extensions
# ---------------------------------------------------------------------------

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp",
}


def _list_images(folder: str) -> List[str]:
    """List supported image files in a folder, sorted by name."""
    result = []
    try:
        for entry in sorted(os.listdir(folder)):
            if Path(entry).suffix.lower() in IMAGE_EXTENSIONS:
                result.append(os.path.join(folder, entry))
    except OSError:
        pass
    return result


# ---------------------------------------------------------------------------
# Main application
# ---------------------------------------------------------------------------

class PhotoFlowApp:
    """Three-tab PhotoFlow application."""

    def __init__(self):
        # ---- root window ----
        if CTK_AVAILABLE:
            ctk.set_appearance_mode("dark")
            ctk.set_default_color_theme("blue")
            self.root = ctk.CTk()
        else:
            self.root = tk.Tk()
        self.root.title("PhotoFlow")
        self.root.geometry("1280x800")

        # ---- state ----
        self._images: List[str] = []
        self._scores: Dict[str, Dict[str, float]] = {}
        self._decisions: Dict[str, str] = {}  # path -> "keep" | "reject"
        self._undo_stack: List[Tuple[str, Optional[str]]] = []  # (path, prev_decision)
        self._max_undo = 50
        self._thumb_cache = ThumbnailCache(maxsize=300)
        self._score_cancel = False
        self._processing_cancel = False
        self._grid_widgets: Dict[str, Any] = {}  # path -> widget frame
        self._style_refs: List[str] = []
        self._style_profile = None
        self._watermark_path: Optional[str] = None
        self._config = _load_config()

        # ---- tabs ----
        if CTK_AVAILABLE:
            self._tabview = ctk.CTkTabview(self.root)
            self._tabview.pack(fill="both", expand=True, padx=10, pady=(10, 0))
            self._tab_cull = self._tabview.add("Cull")
            self._tab_style = self._tabview.add("Style")
            self._tab_export = self._tabview.add("Export")
        else:
            self._notebook = ttk.Notebook(self.root)
            self._notebook.pack(fill="both", expand=True, padx=10, pady=(10, 0))
            self._tab_cull = ttk.Frame(self._notebook)
            self._tab_style = ttk.Frame(self._notebook)
            self._tab_export = ttk.Frame(self._notebook)
            self._notebook.add(self._tab_cull, text="Cull")
            self._notebook.add(self._tab_style, text="Style")
            self._notebook.add(self._tab_export, text="Export")

        # ---- status bar ----
        if CTK_AVAILABLE:
            self._status_var = ctk.StringVar(value="Ready")
            self._status_bar = ctk.CTkLabel(
                self.root, textvariable=self._status_var, anchor="w"
            )
        else:
            self._status_var = tk.StringVar(value="Ready")
            self._status_bar = tk.Label(
                self.root, textvariable=self._status_var, anchor="w"
            )
        self._status_bar.pack(fill="x", padx=10, pady=(0, 5))

        # ---- build each tab ----
        self._build_cull_tab()
        self._build_style_tab()
        self._build_export_tab()

        # ---- keyboard shortcuts ----
        # Undo: Ctrl+Z (Linux/Win), Cmd+Z (macOS)
        if platform.system() == "Darwin":
            self.root.bind_all("<Command-z>", self._undo)
        else:
            self.root.bind_all("<Control-z>", self._undo)

    # ------------------------------------------------------------------
    # Cull tab
    # ------------------------------------------------------------------

    def _build_cull_tab(self):
        top = _frame(self._tab_cull)
        top.pack(fill="x", padx=5, pady=5)

        self._btn_load = _button(top, "Load Folder", self._load_folder)
        self._btn_load.pack(side="left", padx=5)

        self._btn_autocull = _button(top, "Auto-Cull", self._auto_cull)
        self._btn_autocull.pack(side="left", padx=5)

        if CTK_AVAILABLE:
            self._threshold_var = ctk.DoubleVar(value=0.4)
            self._lbl_thresh = ctk.CTkLabel(top, text="Threshold:")
            self._lbl_thresh.pack(side="left", padx=(15, 2))
            self._slider_thresh = ctk.CTkSlider(
                top, from_=0, to=1, variable=self._threshold_var, width=120
            )
            self._slider_thresh.pack(side="left", padx=5)
        else:
            self._threshold_var = tk.DoubleVar(value=0.4)
            tk.Label(top, text="Threshold:").pack(side="left", padx=(15, 2))
            tk.Scale(
                top, from_=0, to=1, orient="horizontal",
                resolution=0.01, variable=self._threshold_var
            ).pack(side="left", padx=5)

        # Scrollable grid
        self._grid_canvas = _canvas(self._tab_cull)
        self._grid_scrollbar = _scrollbar(self._tab_cull, self._grid_canvas)
        self._grid_scrollbar.pack(side="right", fill="y")
        self._grid_canvas.pack(fill="both", expand=True, padx=5, pady=5)

        self._grid_inner = _frame(self._grid_canvas)
        self._grid_canvas.create_window((0, 0), window=self._grid_inner, anchor="nw")
        self._grid_inner.bind("<Configure>", lambda e: self._grid_canvas.configure(
            scrollregion=self._grid_canvas.bbox("all")
        ))

        # Scope mouse-wheel scrolling to the grid canvas only (not app-wide)
        self._grid_canvas.bind("<Enter>", self._bind_grid_scroll)
        self._grid_canvas.bind("<Leave>", self._unbind_grid_scroll)

        # Preview panel
        self._preview_label = _label(self._tab_cull, text="Select an image")
        self._preview_label.pack(side="right", padx=10, pady=10)

    def _bind_grid_scroll(self, _event=None):
        self._grid_canvas.bind_all(
            "<MouseWheel>",
            lambda e: self._grid_canvas.yview_scroll(-int(e.delta / 120), "units"),
        )
        # Linux scroll
        self._grid_canvas.bind_all(
            "<Button-4>",
            lambda e: self._grid_canvas.yview_scroll(-1, "units"),
        )
        self._grid_canvas.bind_all(
            "<Button-5>",
            lambda e: self._grid_canvas.yview_scroll(1, "units"),
        )

    def _unbind_grid_scroll(self, _event=None):
        self._grid_canvas.unbind_all("<MouseWheel>")
        self._grid_canvas.unbind_all("<Button-4>")
        self._grid_canvas.unbind_all("<Button-5>")

    def _load_folder(self):
        if CTK_AVAILABLE:
            folder = ctk.filedialog.askdirectory(title="Select image folder")
        else:
            from tkinter import filedialog
            folder = filedialog.askdirectory(title="Select image folder")
        if not folder:
            return

        # Cancel any in-progress scoring
        self._score_cancel = True

        self._images = _list_images(folder)
        self._scores.clear()
        self._decisions.clear()
        self._undo_stack.clear()
        self._grid_widgets.clear()
        self._thumb_cache.clear()
        self._status_var.set(f"Loaded {len(self._images)} images from {folder}")

        # Full grid rebuild for new folder
        self._rebuild_grid_full()

        # Start parallel scoring
        if self._images:
            self._score_cancel = False
            threading.Thread(target=self._score_all, daemon=True).start()

    def _score_all(self):
        """Score all images in parallel using ThreadPoolExecutor."""
        total = len(self._images)
        completed = 0

        with ThreadPoolExecutor() as pool:
            future_to_path = {
                pool.submit(score_image, p): p for p in self._images
            }
            for future in as_completed(future_to_path):
                if self._score_cancel:
                    pool.shutdown(wait=False, cancel_futures=True)
                    return
                path = future_to_path[future]
                try:
                    scores = future.result()
                    self._scores[path] = scores
                except Exception:
                    logger.debug("Scoring failed for %s", path)
                    self._scores[path] = {"sharpness": 0, "exposure": 0, "overall": 0}

                completed += 1
                # Marshal UI update to main thread via root.after(0, ...)
                c, t = completed, total
                self.root.after(0, lambda c=c, t=t, p=path: self._on_score_update(c, t, p))

    def _on_score_update(self, completed: int, total: int, path: str):
        """Handle a single score result on the main thread — delta update only."""
        self._status_var.set(f"Scoring {completed}/{total}...")
        # Update just the widget for this path instead of rebuilding everything
        self._update_grid_cell(path)
        if completed == total:
            self._status_var.set(f"Scoring complete — {total} images")

    def _rebuild_grid_full(self):
        """Destroy all grid widgets and rebuild from scratch (used on folder load)."""
        for w in self._grid_inner.winfo_children():
            w.destroy()
        self._grid_widgets.clear()

        cols = 5
        for idx, path in enumerate(self._images):
            row, col = divmod(idx, cols)
            cell = self._create_grid_cell(path)
            cell.grid(row=row, column=col, padx=4, pady=4)
            self._grid_widgets[path] = cell

    def _create_grid_cell(self, path: str):
        """Create a single grid cell widget for an image."""
        cell = _frame(self._grid_inner)
        thumb = self._thumb_cache.get(path)

        if CTK_AVAILABLE:
            img_label = ctk.CTkLabel(cell, image=thumb, text="")
        else:
            img_label = tk.Label(cell, image=thumb)
        img_label.pack()
        # Hold reference to prevent GC
        img_label._photo = thumb

        # Filename
        name = Path(path).name
        name_short = name[:18] + "..." if len(name) > 21 else name
        score_text = ""
        if path in self._scores:
            score_text = f"  [{self._scores[path]['overall']:.2f}]"

        decision = self._decisions.get(path, "")
        dec_indicator = ""
        if decision == "keep":
            dec_indicator = " ✓"
        elif decision == "reject":
            dec_indicator = " ✗"

        if CTK_AVAILABLE:
            info_label = ctk.CTkLabel(
                cell, text=f"{name_short}{score_text}{dec_indicator}",
                font=("", 11),
            )
        else:
            info_label = tk.Label(cell, text=f"{name_short}{score_text}{dec_indicator}", font=("", 9))
        info_label.pack()

        # Click handlers
        img_label.bind("<Button-1>", lambda e, p=path: self._show_preview(p))
        # Right-click to toggle keep/reject
        img_label.bind("<Button-2>", lambda e, p=path: self._toggle_decision(p))
        img_label.bind("<Button-3>", lambda e, p=path: self._toggle_decision(p))

        return cell

    def _update_grid_cell(self, path: str):
        """Delta update: replace just one cell's widget."""
        if path not in self._grid_widgets:
            return
        old = self._grid_widgets[path]
        grid_info = old.grid_info()
        old.destroy()
        new_cell = self._create_grid_cell(path)
        new_cell.grid(row=grid_info["row"], column=grid_info["column"], padx=4, pady=4)
        self._grid_widgets[path] = new_cell

    def _show_preview(self, path: str):
        """Show preview of selected image — single open, reused for display + info."""
        try:
            img = load_image_pil(path)
            # Resize for preview
            preview_size = (600, 600)
            img.thumbnail(preview_size, Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)

            if CTK_AVAILABLE:
                self._preview_label.configure(image=photo, text="")
            else:
                self._preview_label.configure(image=photo, text="")
            self._preview_label._photo = photo

            # Update status with image info (reuse the already-opened image data)
            score_info = self._scores.get(path, {})
            status = f"{Path(path).name}"
            if score_info:
                status += f" | Sharp: {score_info.get('sharpness', 0):.1f}"
                status += f" | Exp: {score_info.get('exposure', 0):.3f}"
                status += f" | Overall: {score_info.get('overall', 0):.3f}"
            dec = self._decisions.get(path, "undecided")
            status += f" | {dec}"
            self._status_var.set(status)
        except Exception:
            logger.debug("Cannot preview %s", path)

    def _toggle_decision(self, path: str):
        """Cycle decision: undecided -> keep -> reject -> undecided."""
        prev = self._decisions.get(path)
        if prev is None:
            new = "keep"
        elif prev == "keep":
            new = "reject"
        else:
            new = None

        # Push undo
        self._undo_stack.append((path, prev))
        if len(self._undo_stack) > self._max_undo:
            self._undo_stack.pop(0)

        if new is None:
            self._decisions.pop(path, None)
        else:
            self._decisions[path] = new

        self._update_grid_cell(path)

    def _undo(self, _event=None):
        """Undo last keep/reject decision."""
        if not self._undo_stack:
            return
        path, prev = self._undo_stack.pop()
        if prev is None:
            self._decisions.pop(path, None)
        else:
            self._decisions[path] = prev
        self._update_grid_cell(path)

    def _auto_cull(self):
        """Automatically reject images below the threshold."""
        threshold = self._threshold_var.get()
        count = 0
        for path in self._images:
            if path in self._scores and path not in self._decisions:
                if self._scores[path]["overall"] < threshold:
                    self._undo_stack.append((path, self._decisions.get(path)))
                    self._decisions[path] = "reject"
                    self._update_grid_cell(path)
                    count += 1
        # Trim undo stack
        while len(self._undo_stack) > self._max_undo:
            self._undo_stack.pop(0)
        self._status_var.set(f"Auto-culled {count} images below {threshold:.2f}")

    # ------------------------------------------------------------------
    # Style tab
    # ------------------------------------------------------------------

    def _build_style_tab(self):
        top = _frame(self._tab_style)
        top.pack(fill="x", padx=5, pady=5)

        self._btn_load_refs = _button(top, "Load References", self._load_references)
        self._btn_load_refs.pack(side="left", padx=5)

        if CTK_AVAILABLE:
            self._style_strength_var = ctk.DoubleVar(value=1.0)
            ctk.CTkLabel(top, text="Strength:").pack(side="left", padx=(15, 2))
            self._slider_style = ctk.CTkSlider(
                top, from_=0, to=1, variable=self._style_strength_var, width=150
            )
            self._slider_style.pack(side="left", padx=5)

            self._skin_var = ctk.IntVar(value=5)
            ctk.CTkLabel(top, text="Skin Retouch:").pack(side="left", padx=(15, 2))
            self._slider_skin = ctk.CTkSlider(
                top, from_=0, to=10, variable=self._skin_var, width=120
            )
            self._slider_skin.pack(side="left", padx=5)
        else:
            self._style_strength_var = tk.DoubleVar(value=1.0)
            tk.Label(top, text="Strength:").pack(side="left", padx=(15, 2))
            tk.Scale(
                top, from_=0, to=1, orient="horizontal",
                resolution=0.01, variable=self._style_strength_var,
            ).pack(side="left", padx=5)

            self._skin_var = tk.IntVar(value=5)
            tk.Label(top, text="Skin Retouch:").pack(side="left", padx=(15, 2))
            tk.Scale(
                top, from_=0, to=10, orient="horizontal",
                variable=self._skin_var,
            ).pack(side="left", padx=5)

        # Reference preview area
        self._ref_frame = _frame(self._tab_style)
        self._ref_frame.pack(fill="both", expand=True, padx=5, pady=5)

        if CTK_AVAILABLE:
            self._style_status = ctk.CTkLabel(self._tab_style, text="No style profile loaded")
        else:
            self._style_status = tk.Label(self._tab_style, text="No style profile loaded")
        self._style_status.pack(padx=5, pady=5)

    def _load_references(self):
        if CTK_AVAILABLE:
            files = ctk.filedialog.askopenfilenames(
                title="Select reference images (3-5 recommended)",
                filetypes=[("Images", "*.jpg *.jpeg *.png *.tif *.tiff")],
            )
        else:
            from tkinter import filedialog
            files = filedialog.askopenfilenames(
                title="Select reference images (3-5 recommended)",
                filetypes=[("Images", "*.jpg *.jpeg *.png *.tif *.tiff")],
            )
        if not files:
            return

        self._style_refs = list(files)
        self._status_var.set(f"Building style profile from {len(files)} references...")

        # Build profile on worker thread (not main thread)
        threading.Thread(target=self._build_profile_worker, daemon=True).start()

    def _build_profile_worker(self):
        profile = build_style_profile(self._style_refs)
        self.root.after(0, lambda: self._on_profile_built(profile))

    def _on_profile_built(self, profile):
        self._style_profile = profile
        if profile is not None:
            self._status_var.set(f"Style profile ready ({len(self._style_refs)} refs)")
            if CTK_AVAILABLE:
                self._style_status.configure(
                    text=f"Profile loaded from {len(self._style_refs)} reference images"
                )
            else:
                self._style_status.configure(
                    text=f"Profile loaded from {len(self._style_refs)} reference images"
                )
            # Show reference thumbnails
            self._show_reference_thumbs()
        else:
            self._status_var.set("Failed to build style profile")
            if CTK_AVAILABLE:
                self._style_status.configure(text="Failed — check reference images")
            else:
                self._style_status.configure(text="Failed — check reference images")

    def _show_reference_thumbs(self):
        for w in self._ref_frame.winfo_children():
            w.destroy()
        for i, path in enumerate(self._style_refs[:5]):
            try:
                img = load_image_pil(path)
                img.thumbnail((200, 200), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                if CTK_AVAILABLE:
                    lbl = ctk.CTkLabel(self._ref_frame, image=photo, text="")
                else:
                    lbl = tk.Label(self._ref_frame, image=photo)
                lbl.pack(side="left", padx=5)
                lbl._photo = photo
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Export tab
    # ------------------------------------------------------------------

    def _build_export_tab(self):
        top = _frame(self._tab_export)
        top.pack(fill="x", padx=5, pady=5)

        self._btn_set_output = _button(top, "Set Output Folder", self._set_output_folder)
        self._btn_set_output.pack(side="left", padx=5)

        self._btn_set_watermark = _button(top, "Set Watermark", self._set_watermark)
        self._btn_set_watermark.pack(side="left", padx=5)

        self._btn_start = _button(top, "Start Processing", self._start_processing)
        self._btn_start.pack(side="left", padx=15)

        if CTK_AVAILABLE:
            self._wb_var = ctk.BooleanVar(value=True)
            self._cb_wb = ctk.CTkCheckBox(top, text="Auto White Balance", variable=self._wb_var)
        else:
            self._wb_var = tk.BooleanVar(value=True)
            self._cb_wb = tk.Checkbutton(top, text="Auto White Balance", variable=self._wb_var)
        self._cb_wb.pack(side="left", padx=10)

        # Progress bar
        if CTK_AVAILABLE:
            self._progress = ctk.CTkProgressBar(self._tab_export)
            self._progress.set(0)
        else:
            self._progress = ttk.Progressbar(self._tab_export, mode="determinate")
        self._progress.pack(fill="x", padx=10, pady=10)

        # Output info
        self._output_dir: Optional[str] = None
        if CTK_AVAILABLE:
            self._export_info = ctk.CTkLabel(
                self._tab_export, text="Output: not set", anchor="w"
            )
        else:
            self._export_info = tk.Label(
                self._tab_export, text="Output: not set", anchor="w"
            )
        self._export_info.pack(fill="x", padx=10)

    def _set_output_folder(self):
        if CTK_AVAILABLE:
            folder = ctk.filedialog.askdirectory(title="Select output folder")
        else:
            from tkinter import filedialog
            folder = filedialog.askdirectory(title="Select output folder")
        if folder:
            self._output_dir = folder
            self._export_info.configure(text=f"Output: {folder}")

    def _set_watermark(self):
        if CTK_AVAILABLE:
            path = ctk.filedialog.askopenfilename(
                title="Select watermark/logo image",
                filetypes=[("Images", "*.png *.jpg *.jpeg")],
            )
        else:
            from tkinter import filedialog
            path = filedialog.askopenfilename(
                title="Select watermark/logo image",
                filetypes=[("Images", "*.png *.jpg *.jpeg")],
            )
        if path:
            self._watermark_path = path
            self._status_var.set(f"Watermark: {Path(path).name}")

    def _start_processing(self):
        """Start batch export — runs on worker thread."""
        if not self._output_dir:
            self._status_var.set("Set an output folder first")
            return

        # Collect images to process (kept images, or all if no decisions made)
        to_process = [
            p for p in self._images
            if self._decisions.get(p) == "keep"
        ]
        if not to_process:
            # If no keep decisions, process all non-rejected
            to_process = [
                p for p in self._images
                if self._decisions.get(p) != "reject"
            ]
        if not to_process:
            self._status_var.set("No images to process")
            return

        # Disable start button during processing
        if CTK_AVAILABLE:
            self._btn_start.configure(state="disabled")
        else:
            self._btn_start.configure(state="disabled")

        self._processing_cancel = False
        self._status_var.set(f"Processing {len(to_process)} images...")

        # Build style profile + run pipeline on worker thread
        def _worker():
            pipeline = ProcessingPipeline()

            def _progress(done, total, current):
                self.root.after(0, lambda d=done, t=total, c=current: self._on_export_progress(d, t, c))

            pipeline.process_batch(
                input_paths=to_process,
                output_dir=self._output_dir,
                style_profile=self._style_profile,
                style_strength=self._style_strength_var.get(),
                skin_retouch_strength=int(self._skin_var.get()),
                watermark_path=self._watermark_path,
                do_white_balance=self._wb_var.get(),
                progress_callback=_progress,
                cancel_flag=lambda: self._processing_cancel,
            )
            self.root.after(0, self._on_export_done)

        threading.Thread(target=_worker, daemon=True).start()

    def _on_export_progress(self, done: int, total: int, current: str):
        frac = done / total if total else 0
        if CTK_AVAILABLE:
            self._progress.set(frac)
        else:
            self._progress["value"] = frac * 100
        self._status_var.set(f"Processing {done}/{total} — {Path(current).name}")

    def _on_export_done(self):
        """Re-enable UI after processing completes."""
        if CTK_AVAILABLE:
            self._progress.set(1.0)
            self._btn_start.configure(state="normal")
        else:
            self._progress["value"] = 100
            self._btn_start.configure(state="normal")
        self._status_var.set("Export complete!")

    # ------------------------------------------------------------------
    # Run
    # ------------------------------------------------------------------

    def run(self):
        self.root.mainloop()


# ---------------------------------------------------------------------------
# Widget helpers — abstract CTK vs plain tk
# ---------------------------------------------------------------------------

def _frame(parent, **kw):
    if CTK_AVAILABLE:
        return ctk.CTkFrame(parent, **kw)
    return tk.Frame(parent, **kw)


def _button(parent, text, command, **kw):
    if CTK_AVAILABLE:
        return ctk.CTkButton(parent, text=text, command=command, **kw)
    return tk.Button(parent, text=text, command=command, **kw)


def _label(parent, **kw):
    if CTK_AVAILABLE:
        return ctk.CTkLabel(parent, **kw)
    return tk.Label(parent, **kw)


def _canvas(parent, **kw):
    if CTK_AVAILABLE:
        return ctk.CTkCanvas(parent, **kw)
    return tk.Canvas(parent, **kw)


def _scrollbar(parent, canvas, **kw):
    if CTK_AVAILABLE:
        sb = ctk.CTkScrollbar(parent, command=canvas.yview, **kw)
    else:
        sb = tk.Scrollbar(parent, command=canvas.yview, **kw)
    canvas.configure(yscrollcommand=sb.set)
    return sb


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    app = PhotoFlowApp()
    app.run()


if __name__ == "__main__":
    main()
