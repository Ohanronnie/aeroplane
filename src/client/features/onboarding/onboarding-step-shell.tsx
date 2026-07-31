import { DatabaseExportIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { BrandMark } from "../../components/ui/brand-mark";
import { AppIcon } from "../../components/ui/primitives";

const setupSteps = [
  "Owner account",
  "Runtime",
  "GitHub",
  "Root domain",
  "Backups",
];

export function OnboardingStepShell({
  activeStep,
  children,
  onImport,
  onStepChange,
  steps = setupSteps,
}: {
  activeStep: number;
  children: ReactNode;
  onImport?: () => void;
  onStepChange?: (step: number) => void;
  steps?: string[];
}) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0 opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_58%_85%,rgba(255,255,255,0.04),transparent_28%)]"
      />

      <div className="relative z-10 grid min-h-dvh w-full lg:h-dvh lg:grid-cols-[minmax(0,1.12fr)_minmax(480px,0.88fr)]">
        <section className="relative flex min-h-[560px] flex-col px-6 py-6 sm:px-10 lg:h-dvh lg:min-h-0 lg:px-16 lg:pb-14 lg:pt-8">
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10">
              <BrandMark className="h-[18px] w-[18px] brightness-0 invert" />
            </span>
            <div>
              <div className="font-hero text-sm tracking-[-0.02em] text-white">
                aeroplane
              </div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                Control plane
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-64 hidden h-[580px] w-[580px] opacity-80 md:block"
          >
            <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
            <div className="absolute inset-[74px] rounded-full border border-white/10" />
            <div className="absolute inset-[148px] rounded-full border border-white/[0.13]" />
            <div className="absolute inset-[220px] grid place-items-center rounded-full border border-white/20 bg-white/[0.04]">
              <BrandMark className="h-8 w-8 rotate-[-18deg] brightness-0 invert opacity-80" />
            </div>
            <div className="absolute left-[102px] top-[110px] h-2 w-2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.65)]" />
            <div className="absolute right-[59px] top-[265px] h-1.5 w-1.5 rounded-full bg-white/70" />
            <div className="absolute left-[185px] top-[197px] h-24 w-px rotate-[44deg] bg-gradient-to-b from-transparent via-white/50 to-transparent" />
          </div>

          <nav
            aria-label="Setup progress"
            className="relative z-10 mt-16 w-full max-w-xs lg:mt-24"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Setup journey
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                {String(activeStep + 1).padStart(2, "0")} /{" "}
                {String(steps.length).padStart(2, "0")}
              </span>
            </div>
            <ol>
              {steps.map((item, index) => {
                const active = index === activeStep;
                const done = index < activeStep;
                const available = done && Boolean(onStepChange);

                return (
                  <li
                    key={item}
                    className="relative flex min-h-14 items-start gap-4"
                  >
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => onStepChange?.(index)}
                      aria-current={active ? "step" : undefined}
                      className={`relative z-10 grid h-7 w-7 flex-none place-items-center rounded-full border font-mono text-[9px] transition ${
                        active
                          ? "border-white bg-white text-black"
                          : done
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-white/15 bg-black text-zinc-600"
                      } ${available ? "cursor-pointer hover:bg-white hover:text-black" : ""}`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </button>
                    {index < steps.length - 1 ? (
                      <span
                        className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${
                          done ? "bg-white/30" : "bg-white/10"
                        }`}
                      />
                    ) : null}
                    <span
                      className={`pt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        active
                          ? "text-white"
                          : done
                            ? "text-zinc-300"
                            : "text-zinc-600"
                      }`}
                    >
                      {item}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>

          {onImport ? (
            <button
              type="button"
              className="group relative z-10 mt-auto flex w-fit items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition hover:text-white"
              onClick={onImport}
            >
              <AppIcon icon={DatabaseExportIcon} size={14} />
              Import existing aeroplane
              <span className="transition-transform group-hover:translate-x-0.5">
                ↗
              </span>
            </button>
          ) : (
            <span className="mt-auto font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
              Re-run setup
            </span>
          )}
        </section>

        <section className="flex items-start justify-start border-t border-white/10 bg-zinc-950 px-5 py-10 text-white sm:px-10 lg:h-dvh lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pb-16 lg:pl-8 lg:pr-12 lg:pt-8">
          {children}
        </section>
      </div>
    </main>
  );
}
