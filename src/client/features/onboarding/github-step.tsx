import { CheckmarkCircle02Icon, GithubIcon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { AppIcon } from "../../components/ui/primitives";
import { startGitHubAppManifestFlow } from "../../lib/github-app-manifest";
import type { OnboardingForm } from "./onboarding-types";
import { OnboardingSection, TextAreaField, TextField } from "./onboarding-fields";

export function GitHubStep({
  form,
  update
}: {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setConnecting(true);
    setError("");
    try {
      const result = await startGitHubAppManifestFlow({ redirectTo: "onboarding" });
      if (result.ok) {
        setConnected(true);
      } else {
        setError(result.message);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not connect to GitHub");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <OnboardingSection
      eyebrow="Step 03"
      title="GitHub integration"
      description="Optional. Connect in one click to create and install a GitHub App automatically, or skip this and configure it from system settings later."
    >
      {connected ? (
        <div className="mb-5 flex items-center gap-3 border border-emerald-500/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-200">
          <AppIcon icon={CheckmarkCircle02Icon} size={16} />
          GitHub App created and connected. Finish setup, then install it on your repositories from system settings.
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-zinc-800 bg-zinc-950/70 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center border border-zinc-700 bg-zinc-900 text-zinc-300">
              <AppIcon icon={GithubIcon} size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">One-click connect</div>
              <div className="text-sm text-zinc-200">We create the GitHub App and fill in every credential for you.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting}
            className="inline-flex h-9 items-center justify-center gap-2 border border-[#4FB8B2]/45 bg-[#4FB8B2]/12 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9af4ee] transition hover:bg-[#4FB8B2]/20 disabled:opacity-60"
          >
            <AppIcon icon={GithubIcon} size={14} />
            {connecting ? "Connecting…" : "Connect GitHub"}
          </button>
        </div>
      )}

      {error ? (
        <div className="mb-5 border border-rose-500/35 bg-rose-950/30 px-3.5 py-2.5 font-mono text-[10px] text-rose-300">{error}</div>
      ) : null}

      <button
        type="button"
        onClick={() => setManualOpen((open) => !open)}
        className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200"
      >
        <AppIcon icon={LinkSquare02Icon} size={13} />
        {manualOpen ? "Hide manual setup" : "Enter credentials manually"}
      </button>

      {manualOpen ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="GITHUB_ACCESS_TOKEN" value={form.githubAccessToken} onChange={(githubAccessToken) => update({ githubAccessToken })} type="password" />
          <TextField label="GITHUB_WEBHOOK_SECRET" value={form.githubWebhookSecret} onChange={(githubWebhookSecret) => update({ githubWebhookSecret })} type="password" />
          <TextField label="GITHUB_APP_ID" value={form.githubAppId} onChange={(githubAppId) => update({ githubAppId })} />
          <TextField label="GITHUB_APP_CLIENT_ID" value={form.githubAppClientId} onChange={(githubAppClientId) => update({ githubAppClientId })} />
          <TextField label="GITHUB_APP_SLUG" value={form.githubAppSlug} onChange={(githubAppSlug) => update({ githubAppSlug })} />
          <a
            href="https://github.com/settings/apps/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 self-end border border-zinc-700 bg-zinc-900 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-[#4FB8B2]/45 hover:text-[#9af4ee]"
          >
            <AppIcon icon={LinkSquare02Icon} size={14} />
            Create GitHub App
          </a>
          <div className="md:col-span-2">
            <TextAreaField
              label="GITHUB_APP_PRIVATE_KEY"
              value={form.githubAppPrivateKey}
              onChange={(githubAppPrivateKey) => update({ githubAppPrivateKey })}
              placeholder="-----BEGIN PRIVATE KEY-----"
            />
          </div>
        </div>
      ) : null}
    </OnboardingSection>
  );
}
