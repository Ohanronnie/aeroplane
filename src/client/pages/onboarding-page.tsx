import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { api, type AuthStatus, type OnboardingPayload } from "../api";
import { MigrationImportModal } from "../features/onboarding/migration-import-modal";
import { OnboardingBackupsPage } from "../features/onboarding/onboarding-backups-page";
import { OnboardingDomainPage } from "../features/onboarding/onboarding-domain-page";
import { OnboardingGitHubPage } from "../features/onboarding/onboarding-github-page";
import { OnboardingPageSkeleton } from "../features/onboarding/onboarding-page-skeleton";
import { OnboardingOwnerPage } from "../features/onboarding/onboarding-owner-page";
import {
  OnboardingRestartPage,
  type RestartOnboardingStep,
} from "../features/onboarding/onboarding-restart-page";
import { OnboardingRuntimePage } from "../features/onboarding/onboarding-runtime-page";
import {
  defaultOnboardingForm,
  type OnboardingForm,
} from "../features/onboarding/onboarding-types";
import { usePageTitle } from "../lib/page-title";
import {
  isWildcardRootDomain,
  normalizeRootDomain,
  wildcardRootDomain,
} from "../lib/root-domain";

type OnboardingStepKey =
  | "owner"
  | "runtime"
  | "github"
  | "root-domain"
  | "backups";

const firstRunSteps: OnboardingStepKey[] = [
  "owner",
  "runtime",
  "github",
  "root-domain",
  "backups",
];

const restartSteps = firstRunSteps.filter(
  (item): item is RestartOnboardingStep => item !== "owner",
);

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildPayload(form: OnboardingForm): OnboardingPayload {
  const r2Provided = [
    form.r2AccountId,
    form.r2Bucket,
    form.r2AccessKeyId,
    form.r2SecretAccessKey,
  ].some((value) => value.trim());

  return {
    owner: {
      name: form.ownerName.trim(),
      email: form.ownerEmail.trim(),
      password: form.ownerPassword,
    },
    env: {
      secretKey: clean(form.secretKey),
      dataDir: form.dataDir.trim(),
      deployDryRun: form.deployDryRun,
      caddyConfigPath: form.caddyConfigPath.trim(),
      caddyDataDir: form.caddyDataDir.trim(),
      caddyReloadCmd: form.caddyReloadCmd.trim(),
      port: Number(form.port),
      publicUrl: form.publicUrl.trim(),
      controlPlaneHostname: clean(form.controlPlaneHostname),
      buildkitHost: form.buildkitHost.trim(),
      runtimeNetworkName: form.runtimeNetworkName.trim(),
      githubAccessToken: clean(form.githubAccessToken),
      githubAppId: clean(form.githubAppId),
      githubAppClientId: clean(form.githubAppClientId),
      githubAppSlug: clean(form.githubAppSlug),
      githubAppPrivateKey: clean(form.githubAppPrivateKey),
      githubWebhookSecret: clean(form.githubWebhookSecret),
    },
    rootDomain: clean(normalizeRootDomain(form.rootDomain)),
    r2: r2Provided
      ? {
          accountId: clean(form.r2AccountId),
          bucket: clean(form.r2Bucket),
          accessKeyId: clean(form.r2AccessKeyId),
          secretAccessKey: clean(form.r2SecretAccessKey),
          createBucket: form.r2CreateBucket,
        }
      : undefined,
    databaseBackupScheduleDefaults: form.databaseBackupScheduleDefaults,
  };
}

function buildRestartPayload(
  form: OnboardingForm,
): Omit<OnboardingPayload, "owner"> {
  const payload = buildPayload(form);
  return {
    env: payload.env,
    rootDomain: payload.rootDomain,
    r2: payload.r2,
    databaseBackupScheduleDefaults: payload.databaseBackupScheduleDefaults,
  };
}

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultOnboardingForm);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [migrationImportOpen, setMigrationImportOpen] = useState(false);
  const [error, setError] = useState("");
  usePageTitle("Onboarding");

  const update = (patch: Partial<OnboardingForm>) =>
    setForm((current) => ({ ...current, ...patch }));
  const restartMode = Boolean(
    authStatus?.setupComplete && authStatus.authenticated,
  );
  const activeSteps = restartMode ? restartSteps : firstRunSteps;
  const activeStep =
    activeSteps[step] ?? (restartMode ? "runtime" : "owner");

  useEffect(() => {
    let cancelled = false;
    void api
      .authStatus()
      .then((status) => {
        if (!cancelled) {
          setAuthStatus(status);
          setAuthStatusLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthStatus(null);
          setAuthStatusLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authStatus || hydrated) return;
    setHydrated(true);

    const runtime = authStatus.runtimeConfig;
    if (runtime) {
      setForm((current) => ({
        ...current,
        dataDir: runtime.dataDir,
        deployDryRun: runtime.deployDryRun,
        caddyConfigPath: runtime.caddyConfigPath,
        caddyDataDir: runtime.caddyDataDir,
        caddyReloadCmd: runtime.caddyReloadCmd,
        port: String(runtime.port),
        publicUrl: runtime.publicUrl,
        controlPlaneHostname: runtime.controlPlaneHostname,
        buildkitHost: runtime.buildkitHost,
        runtimeNetworkName: runtime.runtimeNetworkName,
      }));
    }

    if (authStatus.setupComplete && authStatus.authenticated) {
      void api
        .systemSettings()
        .then((result) => {
          setForm((current) => ({
            ...current,
            controlPlaneHostname:
              result.settings.controlPlaneHostname ||
              current.controlPlaneHostname,
            rootDomain: wildcardRootDomain(result.settings.rootDomain),
            databaseBackupScheduleDefaults:
              result.settings.databaseBackupScheduleDefaults,
          }));
        })
        .catch(() => undefined);
    }
  }, [authStatus, hydrated]);

  useEffect(() => {
    if (step >= activeSteps.length) setStep(0);
  }, [activeSteps.length, step]);

  const stepError = useMemo(() => {
    if (activeStep === "owner") {
      if (
        !form.ownerName.trim() ||
        !form.ownerEmail.trim() ||
        !form.ownerPassword
      ) {
        return "Create the owner account first.";
      }
      if (form.ownerPassword.length < 8) {
        return "Password must be at least 8 characters.";
      }
      if (form.ownerPassword !== form.ownerPasswordConfirm) {
        return "Passwords do not match.";
      }
    }

    if (
      activeStep === "runtime" &&
      (!form.dataDir.trim() ||
        !form.publicUrl.trim() ||
        !form.caddyConfigPath.trim() ||
        !form.caddyDataDir.trim() ||
        !form.caddyReloadCmd.trim())
    ) {
      return "Runtime fields are required.";
    }

    if (
      activeStep === "root-domain" &&
      !isWildcardRootDomain(form.rootDomain)
    ) {
      return "Root domain must be a wildcard hostname like *.pilot.aeroplane.run.";
    }

    if (activeStep === "backups") {
      const r2Fields = [
        { label: "R2 account ID", value: form.r2AccountId },
        { label: "R2 bucket", value: form.r2Bucket },
        { label: "R2 access key ID", value: form.r2AccessKeyId },
        { label: "R2 secret access key", value: form.r2SecretAccessKey },
      ];
      const missingR2Fields = r2Fields.filter((field) => !field.value.trim());
      const hasR2Fields = missingR2Fields.length < r2Fields.length;
      if (hasR2Fields && missingR2Fields.length > 0) {
        return `R2 is optional. Add ${missingR2Fields.map((field) => field.label).join(", ")}, or skip R2 for now.`;
      }
    }

    return "";
  }, [activeStep, form]);

  if (authStatusLoading) return <OnboardingPageSkeleton />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < activeSteps.length - 1) {
      if (stepError) {
        setError(stepError);
        return;
      }
      setError("");
      setStep((value) => value + 1);
      return;
    }

    if (stepError) {
      setError(stepError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (restartMode) {
        await api.restartOnboarding(buildRestartPayload(form));
      } else {
        await api.setup(buildPayload(form));
      }
      window.location.replace("/onboarding/success");
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Could not finish setup",
      );
      setSubmitting(false);
    }
  }

  function goToStep(nextStep: number) {
    setError("");
    setStep(nextStep);
  }

  function withMigration(screen: ReactNode) {
    return (
      <>
        {screen}
        <MigrationImportModal
          open={migrationImportOpen}
          onClose={() => setMigrationImportOpen(false)}
        />
      </>
    );
  }

  if (restartMode) {
    return (
      <OnboardingRestartPage
        activeStep={activeStep as RestartOnboardingStep}
        stepIndex={step}
        form={form}
        update={update}
        error={error}
        submitting={submitting}
        onSubmit={submit}
        onStepChange={goToStep}
      />
    );
  }

  const openMigration = () => setMigrationImportOpen(true);

  if (activeStep === "owner") {
    return withMigration(
      <OnboardingOwnerPage
        form={form}
        update={update}
        error={error}
        submitting={submitting}
        onSubmit={submit}
        onImport={openMigration}
      />,
    );
  }

  if (activeStep === "runtime") {
    return withMigration(
      <OnboardingRuntimePage
        form={form}
        update={update}
        error={error}
        submitting={submitting}
        onSubmit={submit}
        onBack={() => goToStep(0)}
        onImport={openMigration}
      />,
    );
  }

  if (activeStep === "github") {
    return withMigration(
      <OnboardingGitHubPage
        form={form}
        update={update}
        error={error}
        submitting={submitting}
        onSubmit={submit}
        onBack={() => goToStep(1)}
        onStepChange={goToStep}
        onImport={openMigration}
      />,
    );
  }

  if (activeStep === "root-domain") {
    return withMigration(
      <OnboardingDomainPage
        form={form}
        update={update}
        error={error}
        submitting={submitting}
        onSubmit={submit}
        onBack={() => goToStep(2)}
        onStepChange={goToStep}
        onImport={openMigration}
      />,
    );
  }

  return withMigration(
    <OnboardingBackupsPage
      form={form}
      update={update}
      error={error}
      submitting={submitting}
      onSubmit={submit}
      onBack={() => goToStep(3)}
      onStepChange={goToStep}
      onImport={openMigration}
    />,
  );
}
