import {
  ArrowRight02Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons";
import type { FormEvent } from "react";
import { AppIcon } from "../../components/ui/primitives";
import type { OnboardingForm } from "./onboarding-types";
import { OnboardingStepShell } from "./onboarding-step-shell";
import { OwnerStep } from "./owner-step";

type OnboardingOwnerPageProps = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
  error: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onImport: () => void;
};

export function OnboardingOwnerPage({
  form,
  update,
  error,
  submitting,
  onSubmit,
  onImport,
}: OnboardingOwnerPageProps) {
  return (
    <OnboardingStepShell activeStep={0} onImport={onImport}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[520px]"
        aria-label="Create owner account"
      >
        <div className="mb-9 flex items-start justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
              <AppIcon icon={ShieldUserIcon} size={18} />
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Step 01 · Identity
            </p>
            <h2 className="mt-2 font-hero text-2xl tracking-[-0.04em] text-white sm:text-3xl">
              Create the owner account
            </h2>
          </div>
          <span className="mt-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Required
          </span>
        </div>

        <p className="mb-8 max-w-md text-sm leading-6 text-zinc-400">
          This is the primary administrator for your Aeroplane instance. You
          can invite more people once setup is complete.
        </p>

        <OwnerStep form={form} update={update} />

        <div className="mt-7 flex items-start gap-3 border-t border-white/10 pt-5">
          <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-zinc-800 text-zinc-300">
            <AppIcon icon={ShieldUserIcon} size={14} />
          </span>
          <p className="text-xs leading-5 text-zinc-400">
            Your credentials stay on this server. Aeroplane never sends them
            to an external service.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="group mt-7 flex h-14 w-full items-center justify-between rounded-sm bg-white px-5 text-left text-black shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
        >
          <span>
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Next: Runtime
            </span>
            <span className="mt-0.5 block text-sm font-semibold">
              Save owner &amp; continue
            </span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
            <AppIcon icon={ArrowRight02Icon} size={16} />
          </span>
        </button>
      </form>
    </OnboardingStepShell>
  );
}
