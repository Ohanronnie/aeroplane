import {
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  DatabaseBackup,
  GithubIcon,
  Globe02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { api, type AuthStatus, type GitHubStatus, type R2SettingsStatus } from "../api";
import { BrandMark } from "../components/ui/brand-mark";
import { AppIcon } from "../components/ui/primitives";
import {
  OnboardingSuccessSummaryRow,
  OnboardingSuccessSummarySkeleton,
} from "../features/onboarding/onboarding-success-summary";
import { usePageTitle } from "../lib/page-title";
import { wildcardRootDomain } from "../lib/root-domain";

type DomainSettings = Awaited<ReturnType<typeof api.systemSettings>>;

const backupScheduleLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
} as const;

function hostnameUrl(hostname: string) {
  return `https://${hostname}`;
}

function enabledBackupScheduleLabel(settings: DomainSettings | null) {
  const scheduleDefaults = settings?.settings.databaseBackupScheduleDefaults;
  if (!scheduleDefaults) return "Off for new databases";
  const enabled = (
    Object.keys(backupScheduleLabels) as Array<
      keyof typeof backupScheduleLabels
    >
  )
    .filter((trigger) => scheduleDefaults[trigger])
    .map((trigger) => backupScheduleLabels[trigger]);
  return enabled.length > 0
    ? `${enabled.join(", ")} for new databases`
    : "Off for new databases";
}

export function OnboardingSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [domainSettings, setDomainSettings] =
    useState<DomainSettings | null>(null);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [r2Status, setR2Status] = useState<R2SettingsStatus | null>(null);
  const [error, setError] = useState("");
  usePageTitle("Onboarding Complete");

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      try {
        const [auth, domains, github, r2] = await Promise.all([
          api.authStatus(),
          api.systemSettings(),
          api.githubStatus().catch(() => null),
          api
            .r2Settings()
            .then((result) => result.r2)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setAuthStatus(auth);
        setDomainSettings(domains);
        setGithubStatus(github);
        setR2Status(r2);
      } catch (issue) {
        if (!cancelled) {
          setError(
            issue instanceof Error
              ? issue.message
              : "Could not load setup summary",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHostname =
    domainSettings?.settings.controlPlaneHostname ?? "";
  const rootDomain = domainSettings?.settings.rootDomain ?? "";
  const backupSchedulesEnabled = Boolean(
    domainSettings &&
      Object.values(
        domainSettings.settings.databaseBackupScheduleDefaults,
      ).some(Boolean),
  );
  const runtime = authStatus?.runtimeConfig;
  const dashboardDnsActive = Boolean(
    dashboardHostname &&
      domainSettings?.controlPlaneDnsStatus === "active",
  );
  const dashboardUrl = useMemo(() => {
    if (dashboardDnsActive) return hostnameUrl(dashboardHostname);
    if (runtime?.publicUrl) return runtime.publicUrl;
    return "/";
  }, [dashboardDnsActive, dashboardHostname, runtime?.publicUrl]);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0"
      />
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[minmax(360px,0.82fr)_minmax(560px,1.18fr)]">
        <section className="relative flex min-h-[480px] flex-col overflow-hidden border-b border-white/10 px-6 py-7 sm:px-10 lg:min-h-dvh lg:border-b-0 lg:border-r lg:px-16 lg:py-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10">
              <BrandMark className="h-[18px] w-[18px] brightness-0 invert" />
            </span>
            <div>
              <div className="font-hero text-sm tracking-[-0.02em]">
                aeroplane
              </div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.25em] text-zinc-500">
                Control plane
              </div>
            </div>
          </div>

          <div className="relative z-10 my-auto py-16">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-black shadow-[0_0_60px_rgba(255,255,255,0.12)]">
              <AppIcon icon={CheckmarkCircle02Icon} size={27} />
            </span>
            <p className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Setup complete · 05 / 05
            </p>
            <h1 className="mt-3 max-w-sm font-hero text-4xl leading-tight tracking-[-0.055em] sm:text-5xl">
              Aeroplane is ready.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
              Your control plane is configured and ready for its first
              deployment.
            </p>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-56 -left-40 h-[540px] w-[540px] rounded-full border border-white/[0.06]"
          >
            <span className="absolute inset-20 rounded-full border border-white/[0.08]" />
            <span className="absolute inset-40 rounded-full border border-white/10" />
          </div>
        </section>

        <section className="bg-zinc-950 px-5 py-10 sm:px-10 lg:h-dvh lg:overflow-y-auto lg:px-12 lg:py-12">
          <div className="w-full max-w-2xl">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Flight check
                </p>
                <h2 className="mt-2 font-hero text-2xl tracking-[-0.04em]">
                  Configuration summary
                </h2>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Saved
              </span>
            </div>

            {error ? (
              <div className="mb-5 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white">
                {error}
              </div>
            ) : null}

            <div className="border-t border-white/10">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <OnboardingSuccessSummarySkeleton key={index} />
                ))
              ) : (
                <>
                  <OnboardingSuccessSummaryRow
                    icon={Globe02Icon}
                    label="Dashboard domain"
                    value={
                      dashboardHostname || runtime?.publicUrl || "IP fallback"
                    }
                    status={
                      dashboardHostname
                        ? dashboardDnsActive
                          ? "DNS active"
                          : "DNS pending"
                        : "IP fallback"
                    }
                    active={dashboardDnsActive}
                  />
                  <OnboardingSuccessSummaryRow
                    icon={Globe02Icon}
                    label="Wildcard root domain"
                    value={
                      rootDomain
                        ? wildcardRootDomain(rootDomain)
                        : "Not configured"
                    }
                    status={
                      rootDomain
                        ? domainSettings?.dnsStatus === "active"
                          ? "DNS active"
                          : "DNS pending"
                        : "Skipped"
                    }
                    active={Boolean(
                      rootDomain && domainSettings?.dnsStatus === "active",
                    )}
                  />
                  <OnboardingSuccessSummaryRow
                    icon={GithubIcon}
                    label="GitHub"
                    value={
                      githubStatus?.appConfigured
                        ? "GitHub App configured"
                        : "Not configured"
                    }
                    status={
                      githubStatus?.connected
                        ? "Connected"
                        : githubStatus?.appConfigured
                          ? "Configured"
                          : "Skipped"
                    }
                    active={Boolean(
                      githubStatus?.connected || githubStatus?.appConfigured,
                    )}
                  />
                  <OnboardingSuccessSummaryRow
                    icon={CloudUploadIcon}
                    label="Cloudflare R2"
                    value={
                      r2Status?.connected
                        ? `${r2Status.bucket} (${r2Status.accountId})`
                        : "Not configured"
                    }
                    status={r2Status?.connected ? "Connected" : "Skipped"}
                    active={Boolean(r2Status?.connected)}
                  />
                  <OnboardingSuccessSummaryRow
                    icon={DatabaseBackup}
                    label="Automatic backups"
                    value={enabledBackupScheduleLabel(domainSettings)}
                    status={backupSchedulesEnabled ? "Enabled" : "Disabled"}
                    active={backupSchedulesEnabled}
                  />
                  <OnboardingSuccessSummaryRow
                    icon={Settings01Icon}
                    label="Runtime"
                    value={
                      runtime
                        ? `${runtime.dataDir} / ${runtime.caddyConfigPath}`
                        : "Loading runtime settings"
                    }
                    status={runtime?.deployDryRun ? "Dry run" : "Live"}
                    active={Boolean(runtime && !runtime.deployDryRun)}
                  />
                </>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => window.location.assign(dashboardUrl)}
              className="group mt-8 flex h-14 w-full items-center justify-between rounded-sm bg-white px-5 text-left text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              <span>
                <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Setup saved
                </span>
                <span className="mt-0.5 block text-sm font-semibold">
                  Open {dashboardDnsActive ? "custom domain" : "dashboard"}
                </span>
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
                <AppIcon icon={ArrowRight02Icon} size={16} />
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
