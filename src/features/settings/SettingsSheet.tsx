import { BottomSheet } from "@/ui/BottomSheet";
import { useStore } from "@/store";
import { detectPlatform } from "@/lib/platform";
import { useOmny } from "@/features/omny/omnyStore";
import { useCommute } from "@/features/commute/commuteStore";
import { clearObservations } from "@/features/commute/observations";
import { STATION_BY_ID } from "@/data/stations";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: Props) {
  const {
    preferredMaps,
    setPreferredMaps,
    reducedMotion,
    setReducedMotion,
    stepFree,
    setStepFree,
    clearAllLocalData,
    favorites,
  } = useStore();
  const { enabled: omnyEnabled, enable: setOmnyEnabled, clear: clearOmny } = useOmny();
  const { commutes, remove: removeCommute, clear: clearCommutes } = useCommute();

  const platform = detectPlatform();

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <section className="space-y-6 pt-2">
        <Group label="Walking directions open in">
          <Radio
            name="maps"
            value="auto"
            current={preferredMaps}
            onChange={setPreferredMaps}
            label={`Auto (${platform === "ios" ? "Apple Maps" : "Google Maps"})`}
          />
          <Radio
            name="maps"
            value="apple"
            current={preferredMaps}
            onChange={setPreferredMaps}
            label="Apple Maps"
          />
          <Radio
            name="maps"
            value="google"
            current={preferredMaps}
            onChange={setPreferredMaps}
            label="Google Maps"
          />
        </Group>

        <Group label="Accessibility">
          <Toggle
            label="Step-free routing"
            checked={stepFree}
            onChange={setStepFree}
          />
          <p className="text-bone-300 text-[11px] leading-snug px-1">
            Route only through stations with step-free access. Based on bundled
            data; live elevator/escalator status coming soon.
          </p>
          <Toggle
            label="Reduced motion"
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
        </Group>

        <Group label="Commutes">
          {commutes.length === 0 ? (
            <p className="text-bone-300 text-[11px] leading-snug px-1">
              PULSE will offer to save a commute after it sees the same
              morning/evening pattern a few times. Learned locally, never
              transmitted.
            </p>
          ) : (
            <ul className="space-y-2">
              {commutes.map((c) => {
                const home = STATION_BY_ID.get(c.home);
                const work = STATION_BY_ID.get(c.work);
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-ink-100 border border-ink-300 px-3 py-2.5"
                  >
                    <span className="text-bone-100 text-xs numerals">
                      {home?.name ?? "?"} ⇄ {work?.name ?? "?"}
                    </span>
                    <button
                      onClick={() => removeCommute(c.id)}
                      className="text-[10px] numerals uppercase tracking-widest text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Group>

        <Group label="OMNY fare companion">
          <Toggle
            label="Enable OMNY companion"
            checked={omnyEnabled}
            onChange={setOmnyEnabled}
          />
          <p className="text-bone-300 text-[11px] leading-snug px-1">
            Manual log only — tap "I tapped in" when you board. Tracks your
            2-hour free-transfer window and your $34 weekly cap locally. Never
            sent off-device. OMNY has no public API.
          </p>
        </Group>

        <Group label="Your data">
          <p className="text-bone-300 text-xs pb-2 numerals">
            {favorites.length} favorite{favorites.length === 1 ? "" : "s"} · stored on-device only · never transmitted
          </p>
          <button
            onClick={() => {
              if (
                confirm("Clear all PULSE data on this device? This cannot be undone.")
              ) {
                clearAllLocalData();
                clearOmny();
                clearCommutes();
                clearObservations().catch(() => { /* ignore */ });
                try { localStorage.removeItem("pulse-omny"); } catch { /* ignore */ }
                try { localStorage.removeItem("pulse-commutes"); } catch { /* ignore */ }
                onClose();
              }
            }}
            className="w-full rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 py-2.5 text-sm"
          >
            Clear all local data
          </button>
        </Group>

        <footer className="pt-3 text-[10px] numerals text-bone-300 uppercase tracking-widest">
          PULSE · v0 · Not affiliated with the MTA
        </footer>
      </section>
    </BottomSheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] numerals uppercase tracking-widest text-bone-300 pb-2">
        {label}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Radio<T extends string>({
  name,
  value,
  current,
  onChange,
  label,
}: {
  name: string;
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const checked = value === current;
  return (
    <label
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
        checked
          ? "bg-gold/10 border-gold/60"
          : "bg-ink-100 border-ink-300 hover:border-ink-400"
      }`}
    >
      <span className="text-bone-100 text-sm">{label}</span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={`h-4 w-4 rounded-full border-2 ${
          checked ? "border-gold bg-gold" : "border-ink-400"
        }`}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg bg-ink-100 border border-ink-300 px-3 py-2.5 cursor-pointer">
      <span className="text-bone-100 text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-10 rounded-full transition-colors relative ${
          checked ? "bg-gold" : "bg-ink-400"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
