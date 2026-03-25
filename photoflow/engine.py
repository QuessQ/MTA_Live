"""
PhotoFlow processing engine — pure image processing, no UI imports.

Uses OpenCV + Pillow + NumPy. Every function here must be free of
tkinter / customtkinter dependencies so it can run headless or in
worker threads.
"""

import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singletons (avoid re-creating on every call)
# ---------------------------------------------------------------------------

_FACE_CASCADE: Optional[cv2.CascadeClassifier] = None


def _get_face_cascade() -> cv2.CascadeClassifier:
    """Return a cached Haar-cascade face detector (created once)."""
    global _FACE_CASCADE
    if _FACE_CASCADE is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _FACE_CASCADE = cv2.CascadeClassifier(cascade_path)
        if _FACE_CASCADE.empty():
            logger.warning("Failed to load Haar cascade from %s", cascade_path)
    return _FACE_CASCADE


# ---------------------------------------------------------------------------
# EXIF helpers
# ---------------------------------------------------------------------------

# Map EXIF orientation tag values to (rotation_degrees, flip_horizontal)
_EXIF_ORIENTATION_OPS = {
    2: (0, True),
    3: (180, False),
    4: (180, True),
    5: (90, True),
    6: (270, False),
    7: (270, True),
    8: (90, False),
}


def _apply_exif_orientation(img: Image.Image) -> Image.Image:
    """Rotate/flip a PIL image according to its EXIF Orientation tag."""
    try:
        exif = img.getexif()
        orientation_key = None
        for k, v in ExifTags.TAGS.items():
            if v == "Orientation":
                orientation_key = k
                break
        if orientation_key is None or orientation_key not in exif:
            return img
        orientation = exif[orientation_key]
        ops = _EXIF_ORIENTATION_OPS.get(orientation)
        if ops is None:
            return img
        rotation, flip = ops
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if rotation == 90:
            img = img.transpose(Image.ROTATE_90)
        elif rotation == 180:
            img = img.transpose(Image.ROTATE_180)
        elif rotation == 270:
            img = img.transpose(Image.ROTATE_270)
    except Exception:
        pass  # No EXIF or malformed — return as-is
    return img


def load_image_pil(path: str) -> Image.Image:
    """Load a PIL image with correct EXIF orientation."""
    img = Image.open(path)
    img = _apply_exif_orientation(img)
    return img


def pil_to_cv2(img: Image.Image) -> np.ndarray:
    """Convert a PIL RGB image to an OpenCV BGR array."""
    rgb = np.array(img.convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def cv2_to_pil(img: np.ndarray) -> Image.Image:
    """Convert an OpenCV BGR array to a PIL RGB image."""
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


# ---------------------------------------------------------------------------
# Scoring functions (used by the Cull tab)
# ---------------------------------------------------------------------------

def score_sharpness(img: np.ndarray) -> float:
    """Return a sharpness score via Laplacian variance (higher = sharper)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def score_exposure(img: np.ndarray) -> float:
    """
    Return an exposure score in [0, 1].
    1.0 = ideal mean brightness (~127), 0.0 = completely over/under-exposed.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    # Distance from ideal midpoint, normalised
    return 1.0 - abs(mean_brightness - 127.0) / 127.0


def score_image(path: str) -> Dict[str, float]:
    """
    Score a single image for sharpness and exposure.
    Returns dict with keys: sharpness, exposure, overall.
    """
    img = cv2.imread(path)
    if img is None:
        return {"sharpness": 0.0, "exposure": 0.0, "overall": 0.0}
    sharpness = score_sharpness(img)
    exposure = score_exposure(img)
    # Normalise sharpness to roughly [0, 1] — 500 is "very sharp"
    norm_sharpness = min(sharpness / 500.0, 1.0)
    overall = 0.6 * norm_sharpness + 0.4 * exposure
    return {
        "sharpness": round(sharpness, 2),
        "exposure": round(exposure, 4),
        "overall": round(overall, 4),
    }


# ---------------------------------------------------------------------------
# Face detection
# ---------------------------------------------------------------------------

def detect_faces(img: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detect faces in a BGR image. Returns list of (x, y, w, h) tuples.
    Uses the module-level cached CascadeClassifier.
    """
    cascade = _get_face_cascade()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    if isinstance(faces, np.ndarray) and len(faces) > 0:
        return [tuple(f) for f in faces.tolist()]
    return []


def scale_face_rects(
    faces: List[Tuple[int, int, int, int]],
    orig_size: Tuple[int, int],
    new_size: Tuple[int, int],
) -> List[Tuple[int, int, int, int]]:
    """Scale face rectangles from orig_size to new_size dimensions."""
    if not faces:
        return []
    sx = new_size[0] / orig_size[0]
    sy = new_size[1] / orig_size[1]
    return [
        (int(x * sx), int(y * sy), int(w * sx), int(h * sy))
        for x, y, w, h in faces
    ]


# ---------------------------------------------------------------------------
# Auto white balance
# ---------------------------------------------------------------------------

def auto_white_balance(img: np.ndarray) -> np.ndarray:
    """
    Simple grey-world white balance with epsilon guard against
    near-zero channel means.
    """
    eps = 1e-6
    result = img.astype(np.float64)
    avg_b = np.mean(result[:, :, 0]) + eps
    avg_g = np.mean(result[:, :, 1]) + eps
    avg_r = np.mean(result[:, :, 2]) + eps
    avg_all = (avg_b + avg_g + avg_r) / 3.0
    result[:, :, 0] *= avg_all / avg_b
    result[:, :, 1] *= avg_all / avg_g
    result[:, :, 2] *= avg_all / avg_r
    return np.clip(result, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# LAB colour transfer (Style tab)
# ---------------------------------------------------------------------------

def lab_color_transfer(
    source: np.ndarray, reference: np.ndarray, strength: float = 1.0
) -> np.ndarray:
    """
    Transfer colour distribution from *reference* to *source* in LAB space.
    strength in [0, 1] blends between original and fully transferred.
    """
    source_lab = cv2.cvtColor(source, cv2.COLOR_BGR2LAB).astype(np.float64)
    ref_lab = cv2.cvtColor(reference, cv2.COLOR_BGR2LAB).astype(np.float64)

    s_mean, s_std = source_lab.mean(axis=(0, 1)), source_lab.std(axis=(0, 1))
    r_mean, r_std = ref_lab.mean(axis=(0, 1)), ref_lab.std(axis=(0, 1))

    # Avoid division by zero
    s_std = np.where(s_std < 1e-6, 1.0, s_std)

    transferred = (source_lab - s_mean) * (r_std / s_std) + r_mean
    # Blend with original according to strength
    blended = source_lab + strength * (transferred - source_lab)
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    return cv2.cvtColor(blended, cv2.COLOR_LAB2BGR)


def build_style_profile(
    reference_paths: List[str],
) -> Optional[Dict[str, np.ndarray]]:
    """
    Build a style profile (mean/std in LAB) from reference images.
    Logs and counts individual load failures instead of silently swallowing them.
    Returns None if ALL references fail to load.
    """
    lab_means: List[np.ndarray] = []
    lab_stds: List[np.ndarray] = []
    fail_count = 0

    for p in reference_paths:
        try:
            img = cv2.imread(p)
            if img is None:
                raise ValueError(f"cv2.imread returned None for {p}")
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float64)
            lab_means.append(lab.mean(axis=(0, 1)))
            lab_stds.append(lab.std(axis=(0, 1)))
        except Exception:
            fail_count += 1
            logger.warning("Failed to load reference image: %s", p)

    if fail_count > 0:
        logger.info(
            "Style profile: %d/%d references failed to load",
            fail_count,
            len(reference_paths),
        )

    if not lab_means:
        logger.error("All reference images failed — cannot build style profile")
        return None

    return {
        "mean": np.mean(lab_means, axis=0),
        "std": np.mean(lab_stds, axis=0),
    }


def apply_style_profile(
    img: np.ndarray,
    profile: Dict[str, np.ndarray],
    strength: float = 1.0,
) -> np.ndarray:
    """Apply a precomputed style profile to an image."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float64)
    s_mean = lab.mean(axis=(0, 1))
    s_std = lab.std(axis=(0, 1))
    s_std = np.where(s_std < 1e-6, 1.0, s_std)

    transferred = (lab - s_mean) * (profile["std"] / s_std) + profile["mean"]
    blended = lab + strength * (transferred - lab)
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    return cv2.cvtColor(blended, cv2.COLOR_LAB2BGR)


# ---------------------------------------------------------------------------
# Skin retouch (simple bilateral filter in face regions)
# ---------------------------------------------------------------------------

def skin_retouch(
    img: np.ndarray,
    faces: List[Tuple[int, int, int, int]],
    strength: int = 5,
) -> np.ndarray:
    """Apply bilateral filter smoothing to detected face regions."""
    result = img.copy()
    d = max(3, strength * 2 + 1)
    sigma = 25 + strength * 10
    for x, y, w, h in faces:
        # Expand region slightly for better blending
        pad = int(min(w, h) * 0.15)
        y1 = max(0, y - pad)
        y2 = min(img.shape[0], y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(img.shape[1], x + w + pad)
        roi = result[y1:y2, x1:x2]
        result[y1:y2, x1:x2] = cv2.bilateralFilter(roi, d, sigma, sigma)
    return result


# ---------------------------------------------------------------------------
# Export helpers
# ---------------------------------------------------------------------------

def _binary_search_quality(
    img: np.ndarray,
    target_min_bytes: int,
    target_max_bytes: int,
    lo: int = 10,
    hi: int = 95,
) -> Tuple[int, bytes]:
    """
    Binary-search for JPEG quality that yields a file size within
    [target_min_bytes, target_max_bytes]. Returns (quality, jpeg_bytes).
    """
    best_quality = lo
    best_buf = None
    while lo <= hi:
        mid = (lo + hi) // 2
        ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, mid])
        if not ok:
            break
        size = len(buf)
        best_quality = mid
        best_buf = buf
        if size < target_min_bytes:
            lo = mid + 1
        elif size > target_max_bytes:
            hi = mid - 1
        else:
            break  # within target range
    # Final encode at best quality if we haven't already
    if best_buf is None:
        _, best_buf = cv2.imencode(
            ".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, best_quality]
        )
    return best_quality, bytes(best_buf)


def save_highres(img: np.ndarray, output_path: str, quality: int = 97) -> str:
    """Save full-resolution JPEG at high quality."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(
        output_path, img, [cv2.IMWRITE_JPEG_QUALITY, quality]
    )
    return output_path


def save_optimized(
    img: np.ndarray,
    output_path: str,
    max_long_edge: int = 3840,
    target_min_mb: float = 1.0,
    target_max_mb: float = 4.0,
) -> str:
    """
    Save an optimized JPEG: resize to max_long_edge, binary-search
    for quality within target file-size range.
    Only writes the final file (no intermediate saves).
    """
    h, w = img.shape[:2]
    scale = min(1.0, max_long_edge / max(h, w))
    if scale < 1.0:
        img = cv2.resize(
            img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )

    target_min = int(target_min_mb * 1024 * 1024)
    target_max = int(target_max_mb * 1024 * 1024)
    _quality, jpeg_bytes = _binary_search_quality(img, target_min, target_max)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(jpeg_bytes)
    return output_path


def save_watermarked(
    img: np.ndarray,
    output_path: str,
    watermark_path: str,
    max_long_edge: int = 3840,
    target_min_mb: float = 1.0,
    target_max_mb: float = 4.0,
    opacity: float = 0.4,
) -> str:
    """
    Same as save_optimized but with a watermark/logo overlay.
    The watermark image is placed at the bottom-right corner.
    """
    h, w = img.shape[:2]
    scale = min(1.0, max_long_edge / max(h, w))
    if scale < 1.0:
        img = cv2.resize(
            img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )

    # Overlay watermark
    if os.path.isfile(watermark_path):
        wm = cv2.imread(watermark_path, cv2.IMREAD_UNCHANGED)
        if wm is not None:
            img = _overlay_watermark(img, wm, opacity)

    target_min = int(target_min_mb * 1024 * 1024)
    target_max = int(target_max_mb * 1024 * 1024)
    _quality, jpeg_bytes = _binary_search_quality(img, target_min, target_max)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(jpeg_bytes)
    return output_path


def _overlay_watermark(
    img: np.ndarray, wm: np.ndarray, opacity: float
) -> np.ndarray:
    """Place a watermark at bottom-right with given opacity."""
    ih, iw = img.shape[:2]
    wh, ww = wm.shape[:2]

    # Scale watermark to ~15% of image width
    target_w = int(iw * 0.15)
    wm_scale = target_w / ww
    wm = cv2.resize(
        wm,
        (target_w, int(wh * wm_scale)),
        interpolation=cv2.INTER_AREA,
    )
    wh, ww = wm.shape[:2]

    # Position: bottom-right with margin
    margin = int(iw * 0.02)
    y1 = ih - wh - margin
    x1 = iw - ww - margin
    y2 = y1 + wh
    x2 = x1 + ww

    if y1 < 0 or x1 < 0:
        return img

    result = img.copy()
    roi = result[y1:y2, x1:x2]

    if wm.shape[2] == 4:
        # Has alpha channel
        alpha = wm[:, :, 3:4].astype(np.float64) / 255.0 * opacity
        wm_bgr = wm[:, :, :3].astype(np.float64)
        roi_f = roi.astype(np.float64)
        blended = roi_f * (1 - alpha) + wm_bgr * alpha
        result[y1:y2, x1:x2] = blended.astype(np.uint8)
    else:
        cv2.addWeighted(wm[:, :, :3], opacity, roi, 1 - opacity, 0, roi)
        result[y1:y2, x1:x2] = roi

    return result


# ---------------------------------------------------------------------------
# Single-image processing pipeline
# ---------------------------------------------------------------------------

def process_single(
    input_path: str,
    output_dir: str,
    style_profile: Optional[Dict[str, np.ndarray]] = None,
    style_strength: float = 1.0,
    skin_retouch_strength: int = 5,
    watermark_path: Optional[str] = None,
    do_white_balance: bool = True,
) -> Dict[str, str]:
    """
    Process a single image through the full pipeline:
    1. Load + EXIF orientation
    2. Auto white balance (optional)
    3. Face detection (once, before any resize)
    4. Style transfer (if profile provided)
    5. Skin retouch (using pre-detected faces)
    6. Save to HighRes / Optimized_SM / Watermarked_SML

    Returns dict mapping format name to output path.
    """
    pil_img = load_image_pil(input_path)
    img = pil_to_cv2(pil_img)

    # Detect faces once on the full-resolution image
    faces = detect_faces(img)
    orig_h, orig_w = img.shape[:2]

    if do_white_balance:
        img = auto_white_balance(img)

    if style_profile is not None:
        img = apply_style_profile(img, style_profile, style_strength)

    if faces:
        img = skin_retouch(img, faces, skin_retouch_strength)

    stem = Path(input_path).stem
    outputs = {}

    # HighRes
    hr_path = os.path.join(output_dir, "HighRes", f"{stem}.jpg")
    outputs["highres"] = save_highres(img, hr_path)

    # Optimized_SM (4K)
    sm_path = os.path.join(output_dir, "Optimized_SM", f"{stem}.jpg")
    outputs["optimized"] = save_optimized(img, sm_path)

    # Watermarked_SML
    if watermark_path and os.path.isfile(watermark_path):
        wm_path = os.path.join(output_dir, "Watermarked_SML", f"{stem}.jpg")
        outputs["watermarked"] = save_watermarked(img, wm_path, watermark_path)

    return outputs


# ---------------------------------------------------------------------------
# Batch processing pipeline
# ---------------------------------------------------------------------------

class ProcessingPipeline:
    """
    Concurrent batch processing via ThreadPoolExecutor.
    Accepts max_workers (defaults to CPU count) and a progress callback.
    """

    def __init__(self, max_workers: Optional[int] = None):
        self.max_workers = max_workers or os.cpu_count() or 4

    def process_batch(
        self,
        input_paths: List[str],
        output_dir: str,
        style_profile: Optional[Dict[str, np.ndarray]] = None,
        style_strength: float = 1.0,
        skin_retouch_strength: int = 5,
        watermark_path: Optional[str] = None,
        do_white_balance: bool = True,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
        cancel_flag: Optional[Callable[[], bool]] = None,
    ) -> List[Dict[str, str]]:
        """
        Process all images concurrently.

        progress_callback(completed, total, current_file) is called after
        each image finishes.
        cancel_flag() returns True to abort remaining work.
        """
        total = len(input_paths)
        results: List[Dict[str, str]] = []
        completed = 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as pool:
            future_to_path = {
                pool.submit(
                    process_single,
                    p,
                    output_dir,
                    style_profile,
                    style_strength,
                    skin_retouch_strength,
                    watermark_path,
                    do_white_balance,
                ): p
                for p in input_paths
            }

            for future in as_completed(future_to_path):
                if cancel_flag and cancel_flag():
                    pool.shutdown(wait=False, cancel_futures=True)
                    break

                path = future_to_path[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception:
                    logger.exception("Failed to process %s", path)
                    results.append({})

                completed += 1
                if progress_callback:
                    progress_callback(completed, total, path)

        return results
