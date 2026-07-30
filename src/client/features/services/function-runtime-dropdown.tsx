import { ArrowDown01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { functionRuntimeLabels, functionRuntimes, type FunctionRuntime } from "../../../shared/service-functions";
import { AppIcon } from "../../components/ui/primitives";

const runtimeIconSlugs: Record<FunctionRuntime, string> = {
  node: "nodejs",
  bun: "bun",
  python: "python"
};

function RuntimeLogo({ runtime, size = 20 }: { runtime: FunctionRuntime; size?: number }) {
  return (
    <img
      src={`/api/assets/framework-icons/${runtimeIconSlugs[runtime]}.svg`}
      alt=""
      className="shrink-0 object-contain"
      style={{ height: size, width: size }}
      loading="lazy"
    />
  );
}

export function FunctionRuntimeDropdown({
  value,
  onChange,
  disabled = false,
  className = ""
}: {
  value: FunctionRuntime;
  onChange: (runtime: FunctionRuntime) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = useMemo(() => functionRuntimeLabels[value], [value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between gap-3 border border-white/15 bg-black px-3 text-left text-xs text-zinc-300 outline-none transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <RuntimeLogo runtime={value} />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <AppIcon icon={ArrowDown01Icon} size={15} className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto border border-white/15 bg-black p-1 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
          role="listbox"
        >
          {functionRuntimes.map((runtime) => {
            const active = runtime === value;
            return (
              <button
                key={runtime}
                type="button"
                className={`flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-xs transition ${
                  active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                }`}
                onClick={() => {
                  onChange(runtime);
                  setOpen(false);
                }}
                role="option"
                aria-selected={active}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <RuntimeLogo runtime={runtime} />
                  <span className="truncate">{functionRuntimeLabels[runtime]}</span>
                </span>
                {active ? <AppIcon icon={CheckmarkCircle02Icon} size={15} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
