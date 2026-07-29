import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { FormEvent } from "react";
import { AppIcon } from "../../components/ui/primitives";
import { OnboardingStepShell } from "./onboarding-step-shell";
import type { OnboardingForm } from "./onboarding-types";
import { RuntimeConfigurationFields } from "./runtime-configuration-fields";

type OnboardingRuntimePageProps = {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
  error: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onImport: () => void;
};

export function OnboardingRuntimePage({
  form,
  update,
  error,
  submitting,
  onSubmit,
  onBack,
  onImport,
}: OnboardingRuntimePageProps) {
  return (
    <OnboardingStepShell
      activeStep={1}
      onImport={onImport}
      onStepChange={(step) => {
        if (step === 0) onBack();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[560px]"
        aria-label="Configure runtime"
      >
        <div className="mb-9 flex items-start justify-between gap-5">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
              <AppIcon icon={Settings01Icon} size={18} />
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Step 02 · Environment
            </p>
            <h2 className="mt-2 font-hero text-2xl tracking-[-0.04em] text-white sm:text-3xl">
              Configure the runtime
            </h2>
          </div>
          <span className="mt-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Host settings
          </span>
        </div>

        <p className="mb-8 max-w-md text-sm leading-6 text-zinc-400">
          These settings define where Aeroplane stores data, builds services,
          and routes traffic on this server.
        </p>

        <RuntimeConfigurationFields form={form} update={update} />

        {error ? (
          <div
            role="alert"
            className="mt-6 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="grid h-14 w-14 flex-none place-items-center rounded-sm border border-white/15 text-zinc-400 transition hover:border-white/30 hover:text-white disabled:opacity-50"
            aria-label="Back to owner account"
          >
            <AppIcon icon={ArrowLeft01Icon} size={17} />
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="group flex h-14 flex-1 items-center justify-between rounded-sm bg-white px-5 text-left text-black shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
          >
            <span>
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Next: GitHub
              </span>
              <span className="mt-0.5 block text-sm font-semibold">
                Save runtime &amp; continue
              </span>
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
              <AppIcon icon={ArrowRight02Icon} size={16} />
            </span>
          </button>
        </div>
      </form>
    </OnboardingStepShell>
  );
}
