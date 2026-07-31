import {
  CheckmarkCircle02Icon,
  GithubIcon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { AppIcon } from "../../components/ui/primitives";
import { startGitHubAppManifestFlow } from "../../lib/github-app-manifest";
import type { OnboardingForm } from "./onboarding-types";

function GitHubField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

export function GitHubConfiguration({
  form,
  update,
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
      const result = await startGitHubAppManifestFlow({
        redirectTo: "onboarding",
      });
      if (result.ok) {
        setConnected(true);
      } else {
        setError(result.message);
      }
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Could not connect to GitHub",
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      {connected ? (
        <div className="flex items-start gap-3 border border-white/20 bg-white/10 px-4 py-4">
          <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-white text-black">
            <AppIcon icon={CheckmarkCircle02Icon} size={14} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">GitHub connected</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Finish onboarding, then choose repositories from system settings.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 bg-black/30 p-5">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full border border-white/15 bg-white/5 text-white">
              <AppIcon icon={GithubIcon} size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Create a GitHub App automatically
              </p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                Aeroplane fills every credential and returns you here when the
                GitHub App is ready.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-white font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-zinc-200 disabled:opacity-60"
          >
            <AppIcon icon={GithubIcon} size={15} />
            {connecting ? "Connecting…" : "Connect GitHub"}
          </button>
        </div>
      )}

      {error ? (
        <div className="mt-4 border-l-2 border-white bg-white/10 px-4 py-3 text-xs text-zinc-200">
          {error}
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-600">
          Or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={() => setManualOpen((open) => !open)}
        className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400 transition hover:text-white"
      >
        <AppIcon icon={LinkSquare02Icon} size={13} />
        {manualOpen ? "Hide manual credentials" : "Enter credentials manually"}
      </button>

      {manualOpen ? (
        <div className="mt-5 grid gap-y-5">
          <GitHubField
            label="Access token"
            value={form.githubAccessToken}
            onChange={(githubAccessToken) => update({ githubAccessToken })}
            type="password"
          />
          <GitHubField
            label="Webhook secret"
            value={form.githubWebhookSecret}
            onChange={(githubWebhookSecret) =>
              update({ githubWebhookSecret })
            }
            type="password"
          />
          <GitHubField
            label="App ID"
            value={form.githubAppId}
            onChange={(githubAppId) => update({ githubAppId })}
          />
          <GitHubField
            label="App client ID"
            value={form.githubAppClientId}
            onChange={(githubAppClientId) => update({ githubAppClientId })}
          />
          <GitHubField
            label="App slug"
            value={form.githubAppSlug}
            onChange={(githubAppSlug) => update({ githubAppSlug })}
          />
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              App private key
            </span>
            <textarea
              value={form.githubAppPrivateKey}
              onChange={(event) =>
                update({ githubAppPrivateKey: event.target.value })
              }
              placeholder="-----BEGIN PRIVATE KEY-----"
              spellCheck={false}
              className="min-h-32 w-full resize-y rounded-sm border border-white/15 bg-white/5 px-3.5 py-3 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
            />
          </label>
          <a
            href="https://github.com/settings/apps/new"
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-sm border border-white/15 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-white/30 hover:text-white"
          >
            <AppIcon icon={LinkSquare02Icon} size={13} />
            Open GitHub App settings
          </a>
        </div>
      ) : null}
    </div>
  );
}
