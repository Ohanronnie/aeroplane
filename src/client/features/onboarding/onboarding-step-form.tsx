import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { FormEvent, ReactNode } from "react";
import { AppIcon } from "../../components/ui/primitives";

export function OnboardingStepForm({
  icon,
  eyebrow,
  title,
  badge,
  description,
  children,
  error,
  submitting,
  nextLabel,
  actionLabel,
  finish = false,
  onSubmit,
  onBack,
}: {
  icon: unknown;
  eyebrow: string;
  title: string;
  badge: string;
  description: ReactNode;
  children: ReactNode;
  error: string;
  submitting: boolean;
  nextLabel: string;
  actionLabel: string;
  finish?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-[560px]"
      aria-label={title}
    >
      <div className="mb-9 flex items-start justify-between gap-5">
        <div>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
            <AppIcon icon={icon} size={18} />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-hero text-2xl tracking-[-0.04em] text-white sm:text-3xl">
            {title}
          </h2>
        </div>
        <span className="mt-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {badge}
        </span>
      </div>

      <div className="mb-8 max-w-md text-sm leading-6 text-zinc-400">
        {description}
      </div>

      {children}

      {error ? (
        <div
          role="alert"
          className="mt-6 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-7 flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="grid h-14 w-14 flex-none place-items-center rounded-sm border border-white/15 text-zinc-400 transition hover:border-white/30 hover:text-white disabled:opacity-50"
            aria-label="Previous onboarding step"
          >
            <AppIcon icon={ArrowLeft01Icon} size={17} />
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="group flex h-14 flex-1 items-center justify-between rounded-sm bg-white px-5 text-left text-black shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
        >
          <span>
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              {nextLabel}
            </span>
            <span className="mt-0.5 block text-sm font-semibold">
              {submitting ? "Saving…" : actionLabel}
            </span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
            <AppIcon
              icon={finish ? CheckmarkCircle02Icon : ArrowRight02Icon}
              size={16}
            />
          </span>
        </button>
      </div>
    </form>
  );
}
