import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  CopyCheckIcon,
  CopyIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Refresh03Icon
} from "@hugeicons/core-free-icons";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { AppIcon, FieldLabel, FormInput } from "../ui/primitives";

function cleanDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\.+$/, "");
}

export function ControlPlaneDomainSettingsPanel({ open }: { open: boolean }) {
  const [hostname, setHostname] = useState("");
  const [savedHostname, setSavedHostname] = useState("");
  const [publicIp, setPublicIp] = useState("127.0.0.1");
  const [dnsStatus, setDnsStatus] = useState<"active" | "pending">("pending");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const normalizedHostname = useMemo(() => cleanDomain(hostname), [hostname]);
  const hasSavedHostname = savedHostname.length > 0;
  const hasUnsavedChanges = normalizedHostname !== savedHostname;
  const waitingForDns = success.startsWith("Still waiting");

  useEffect(() => {
    if (!open) return;

    async function loadSettings() {
      setError("");
      setSuccess("");
      try {
        const res = await api.systemSettings();
        const loadedHostname = cleanDomain(res.settings.controlPlaneHostname);
        setHostname(loadedHostname);
        setSavedHostname(loadedHostname);
        setEditing(!loadedHostname);
        setPublicIp(res.publicIp || "127.0.0.1");
        setDnsStatus(res.controlPlaneDnsStatus || "pending");
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Could not load dashboard domain settings");
      }
    }

    void loadSettings();
  }, [open]);

  async function copyIp() {
    try {
      await navigator.clipboard.writeText(publicIp);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 1500);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not copy IP address");
    }
  }

  async function refreshSettings() {
    setVerifying(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.systemSettings();
      const loadedHostname = cleanDomain(res.settings.controlPlaneHostname);
      const nextStatus = res.controlPlaneDnsStatus || "pending";
      setHostname(loadedHostname);
      setSavedHostname(loadedHostname);
      setDnsStatus(nextStatus);
      setPublicIp(res.publicIp || "127.0.0.1");
      setSuccess(nextStatus === "active" ? "Dashboard DNS is active." : "Still waiting on dashboard DNS.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not verify dashboard DNS");
    } finally {
      setVerifying(false);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.updateSystemSettings({ controlPlaneHostname: normalizedHostname });
      const saved = cleanDomain(res.settings.controlPlaneHostname);
      const latest = await api.systemSettings();
      setHostname(saved);
      setSavedHostname(saved);
      setPublicIp(latest.publicIp || "127.0.0.1");
      setDnsStatus(latest.controlPlaneDnsStatus || "pending");
      setEditing(false);
      setSuccess(res.caddy?.ok === false ? `Dashboard domain saved. Caddy reload: ${res.caddy.detail}` : "Dashboard domain saved.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save dashboard domain");
    } finally {
      setSaving(false);
    }
  }

  async function clearHostname() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.updateSystemSettings({ controlPlaneHostname: "" });
      setHostname("");
      setSavedHostname("");
      setDnsStatus("pending");
      setEditing(true);
      setSuccess("Dashboard domain removed.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not remove dashboard domain");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="p-5 sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl tracking-[-0.03em] text-white">Dashboard domain</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            The hostname used to access this Aeroplane control plane.
          </p>
          {hasSavedHostname && !editing ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-lg text-zinc-100">{savedHostname}</span>
              <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                <span className={`h-1.5 w-1.5 ${dnsStatus === "active" ? "bg-white" : "border border-zinc-600"}`} />
                {dnsStatus === "active" ? "DNS active" : "DNS pending"}
              </span>
            </div>
          ) : null}
        </div>

        {hasSavedHostname && !editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white"
              onClick={() => setEditing(true)}
              title="Edit dashboard domain"
              aria-label="Edit dashboard domain"
            >
              <AppIcon icon={PencilEdit02Icon} size={15} />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white"
              onClick={() => void clearHostname()}
              title="Delete dashboard domain"
              aria-label="Delete dashboard domain"
            >
              <AppIcon icon={Delete02Icon} size={15} />
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={saveSettings} className="mt-7 max-w-xl">
          <div>
            <FieldLabel>Dashboard domain</FieldLabel>
            <FormInput
              value={hostname}
              onBlur={() => setHostname(normalizedHostname)}
              onChange={(event) => setHostname(event.target.value)}
              placeholder="pilot.aeroplane.run"
              inputMode="url"
              autoComplete="off"
              variant="monochrome"
              className="border-white/15 bg-white/[0.03]"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 w-fit items-center justify-center bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || !normalizedHostname || !hasUnsavedChanges}
            >
              {saving ? "Saving..." : "Save dashboard domain"}
            </button>
            {hasSavedHostname ? (
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center border border-white/15 px-4 text-sm text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
                onClick={() => {
                  setHostname(savedHostname);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {hasSavedHostname && !editing ? (
        <div className="mt-7 max-w-2xl border-y border-white/10 font-mono text-[10px]">
          <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/10">
            <div className="py-3 uppercase tracking-[0.18em] text-zinc-600">Type</div>
            <div className="py-3 text-zinc-200">A</div>
          </div>
          <div className="grid grid-cols-[100px_minmax(0,1fr)] border-b border-white/10">
            <div className="py-3 uppercase tracking-[0.18em] text-zinc-600">Host</div>
            <div className="truncate py-3 text-zinc-200">{savedHostname}</div>
          </div>
          <div className="grid grid-cols-[100px_minmax(0,1fr)]">
            <div className="py-3 uppercase tracking-[0.18em] text-zinc-600">Value</div>
            <div className="flex min-w-0 items-center gap-2 py-3">
              <span className="truncate text-zinc-200">{publicIp}</span>
              <button type="button" onClick={copyIp} className="shrink-0 p-0.5 text-zinc-500 transition-colors hover:text-zinc-200" title={copiedIp ? "Copied" : "Copy IP"}>
                <AppIcon icon={copiedIp ? CopyCheckIcon : CopyIcon} size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hasSavedHostname && !editing ? (
        <button
          type="button"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void refreshSettings()}
          disabled={verifying}
        >
          <AppIcon icon={Refresh03Icon} size={13} className={verifying ? "animate-spin" : ""} />
          Verify DNS
        </button>
      ) : null}

      {error ? <div className="mt-5 border-l-2 border-white bg-white/[0.06] px-4 py-3 text-sm text-zinc-200">{error}</div> : null}
      {success ? (
        <div
          className={
            waitingForDns
              ? "mt-5 flex items-center gap-2 border-l-2 border-amber-400 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
              : "mt-5 flex items-center gap-2 border-l-2 border-emerald-400 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          }
        >
          <AppIcon icon={waitingForDns ? AlertCircleIcon : CheckmarkCircle02Icon} size={14} />
          {success}
        </div>
      ) : null}
    </section>
  );
}
