import {
  CloudUploadIcon,
  GithubIcon,
  Globe02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { FormEvent, ReactNode } from "react";
import { BackupConfiguration } from "./backup-configuration";
import { DomainConfiguration } from "./domain-configuration";
import { GitHubConfiguration } from "./github-configuration";
import { OnboardingStepForm } from "./onboarding-step-form";
import { OnboardingStepShell } from "./onboarding-step-shell";
import type { OnboardingForm } from "./onboarding-types";
import { RuntimeConfigurationFields } from "./runtime-configuration-fields";

export type RestartOnboardingStep =
  | "runtime"
  | "github"
  | "root-domain"
  | "backups";

const restartSteps = ["Runtime", "GitHub", "Root domain", "Backups"];

const stepContent: Record<
  RestartOnboardingStep,
  {
    icon: unknown;
    eyebrow: string;
    title: string;
    badge: string;
    description: string;
  }
> = {
  runtime: {
    icon: Settings01Icon,
    eyebrow: "Re-run · Environment",
    title: "Review the runtime",
    badge: "Host settings",
    description:
      "Review where Aeroplane stores data, builds services, and routes traffic on this server.",
  },
  github: {
    icon: GithubIcon,
    eyebrow: "Re-run · Source control",
    title: "Review GitHub",
    badge: "Optional",
    description:
      "Keep the current integration, reconnect a GitHub App, or enter credentials manually.",
  },
  "root-domain": {
    icon: Globe02Icon,
    eyebrow: "Re-run · Networking",
    title: "Review your domains",
    badge: "Optional",
    description:
      "Update the dashboard hostname and wildcard service domain used by Aeroplane.",
  },
  backups: {
    icon: CloudUploadIcon,
    eyebrow: "Re-run · Resilience",
    title: "Review your backups",
    badge: "Final step",
    description:
      "Update default database schedules and optional Cloudflare R2 storage.",
  },
};

export function OnboardingRestartPage({
  activeStep,
  stepIndex,
  form,
  update,
  error,
  submitting,
  onSubmit,
  onStepChange,
}: {
  activeStep: RestartOnboardingStep;
  stepIndex: number;
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
  error: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStepChange: (step: number) => void;
}) {
  const metadata = stepContent[activeStep];
  const finalStep = stepIndex === restartSteps.length - 1;
  let fields: ReactNode;

  if (activeStep === "runtime") {
    fields = <RuntimeConfigurationFields form={form} update={update} />;
  } else if (activeStep === "github") {
    fields = <GitHubConfiguration form={form} update={update} />;
  } else if (activeStep === "root-domain") {
    fields = <DomainConfiguration form={form} update={update} />;
  } else {
    fields = <BackupConfiguration form={form} update={update} />;
  }

  return (
    <OnboardingStepShell
      activeStep={stepIndex}
      steps={restartSteps}
      onStepChange={onStepChange}
    >
      <OnboardingStepForm
        icon={metadata.icon}
        eyebrow={metadata.eyebrow}
        title={metadata.title}
        badge={metadata.badge}
        description={metadata.description}
        error={error}
        submitting={submitting}
        nextLabel={
          finalStep ? "Save changes" : `Next: ${restartSteps[stepIndex + 1]}`
        }
        actionLabel={
          finalStep
            ? "Save setup"
            : `Continue to ${restartSteps[stepIndex + 1].toLowerCase()}`
        }
        finish={finalStep}
        onSubmit={onSubmit}
        onBack={
          stepIndex > 0 ? () => onStepChange(stepIndex - 1) : undefined
        }
      >
        {fields}
      </OnboardingStepForm>
    </OnboardingStepShell>
  );
}
