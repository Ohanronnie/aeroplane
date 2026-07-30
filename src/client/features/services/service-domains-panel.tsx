import { Add01Icon, Globe02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { api, type DnsProviderId, type DnsProviderStatus, type Domain } from "../../api";
import { AppIcon, FormInput } from "../../components/ui/primitives";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { ServiceDomainRow } from "./service-domain-row";

export function ServiceDomainsPanel({
  serviceId,
  domains,
  publicIp,
  busy,
  doAction,
  loadOverview
}: {
  serviceId: string;
  domains: Domain[];
  publicIp?: string;
  busy: string;
  doAction: (label: string, action: () => Promise<void>) => Promise<void>;
  loadOverview: () => Promise<void>;
}) {
  const [domainForm, setDomainForm] = useState({ hostname: "" });
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const [copiedIpDomainId, setCopiedIpDomainId] = useState<string | null>(null);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editingHostname, setEditingHostname] = useState("");
  const [deleteDomainId, setDeleteDomainId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshingDns, setRefreshingDns] = useState(false);
  const [owner, setOwner] = useState(false);
  const [connectedDnsProviders, setConnectedDnsProviders] = useState<DnsProviderStatus[]>([]);
  const [dnsProviderBusyId, setDnsProviderBusyId] = useState<DnsProviderId | null>(null);
  const [dnsActionNotice, setDnsActionNotice] = useState<{ domainId: string; tone: "success" | "error"; text: string } | null>(null);
  const domainPendingDelete = domains.find((domain) => domain.id === deleteDomainId) ?? null;

  useEffect(() => {
    let ignore = false;

    async function loadDnsProviders() {
      try {
        const status = await api.authStatus();
        if (!ignore) setOwner(status.user?.role === "owner");
        if (status.user?.role !== "owner") {
          if (!ignore) setConnectedDnsProviders([]);
          return;
        }

        const response = await api.dnsSettings();
        if (!ignore) setConnectedDnsProviders(response.dns.providers.filter((provider) => provider.connected));
      } catch (error) {
        console.error("Failed to load connected DNS providers:", error);
      }
    }

    void loadDnsProviders();
    return () => {
      ignore = true;
    };
  }, []);

  async function copyIp(domainId: string, targetIp: string) {
    try {
      await navigator.clipboard.writeText(targetIp);
      setCopiedIpDomainId(domainId);
      window.setTimeout(() => setCopiedIpDomainId(null), 1500);
    } catch (issue) {
      console.error("Failed to copy IP:", issue);
    }
  }

  async function applyDnsRecord(domain: Domain, providerId: DnsProviderId) {
    const provider = connectedDnsProviders.find((item) => item.id === providerId);
    setDnsProviderBusyId(providerId);
    setDnsActionNotice(null);

    try {
      const response = await api.applyDnsRecord(serviceId, domain.id, providerId);
      const actionLabel = response.result.action === "created" ? "Added" : "Updated";
      setDnsActionNotice({
        domainId: domain.id,
        tone: "success",
        text: `${actionLabel} A record in ${provider?.name ?? response.result.providerName}.`
      });
      await loadOverview();
    } catch (error) {
      setDnsActionNotice({
        domainId: domain.id,
        tone: "error",
        text: error instanceof Error ? error.message : `Could not update ${provider?.name ?? "DNS provider"}.`
      });
    } finally {
      setDnsProviderBusyId(null);
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-[1100px] overflow-hidden border border-white/10 bg-black">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg tracking-[-0.03em] text-white">Domains</h2>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
              {domains.length} custom {domains.length === 1 ? "domain" : "domains"}
            </p>
          </div>
          {!showAddForm ? (
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-2 bg-white px-3 text-xs text-black transition hover:bg-zinc-200"
              onClick={() => {
                setShowAddForm(true);
                setDomainForm({ hostname: "" });
              }}
            >
              <AppIcon icon={Add01Icon} size={13} />
              Add domain
            </button>
          ) : null}
        </header>

        {showAddForm ? (
          <form
            className="flex flex-wrap items-end gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5"
            onSubmit={(event) => {
              event.preventDefault();
              void doAction("domain", async () => {
                await api.addDomain(serviceId, domainForm);
                setDomainForm({ hostname: "" });
                setShowAddForm(false);
              });
            }}
          >
            <label className="min-w-56 flex-1">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">Hostname</span>
              <FormInput
                value={domainForm.hostname}
                onChange={(event) => setDomainForm({ hostname: event.target.value })}
                placeholder="app.example.com"
                required
                variant="monochrome"
                className="!h-9 border-white/15 bg-black font-mono text-xs"
              />
            </label>
            <button type="button" className="inline-flex h-9 items-center justify-center border border-white/15 px-3 text-xs text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="inline-flex h-9 items-center justify-center bg-white px-3 text-xs text-black transition hover:bg-zinc-200 disabled:opacity-40" disabled={busy === "domain"}>
              Save domain
            </button>
          </form>
        ) : null}

        {domains.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center p-8 text-center">
            <div>
              <AppIcon icon={Globe02Icon} size={22} className="mx-auto text-zinc-700" />
              <h3 className="mt-4 text-sm text-zinc-300">No custom domains</h3>
              <p className="mt-2 text-xs text-zinc-600">Add a hostname to route traffic to this service.</p>
            </div>
          </div>
        ) : (
          domains.map((domain) => (
            <ServiceDomainRow
              key={domain.id}
              domain={domain}
              publicIp={publicIp}
              expanded={expandedDomainId === domain.id}
              copied={copiedIpDomainId === domain.id}
              editing={editingDomainId === domain.id}
              editingHostname={editingHostname}
              busy={busy === "domain"}
              refreshingDns={refreshingDns}
              owner={owner}
              providers={connectedDnsProviders}
              busyProviderId={dnsProviderBusyId}
              notice={dnsActionNotice}
              onToggle={() => setExpandedDomainId((current) => current === domain.id ? null : domain.id)}
              onCopyIp={(targetIp) => void copyIp(domain.id, targetIp)}
              onStartEdit={() => {
                setEditingDomainId(domain.id);
                setEditingHostname(domain.hostname);
              }}
              onEditingHostnameChange={setEditingHostname}
              onCancelEdit={() => setEditingDomainId(null)}
              onSaveEdit={() => {
                void doAction("domain", async () => {
                  await api.updateDomain(serviceId, domain.id, { hostname: editingHostname });
                  setEditingDomainId(null);
                });
              }}
              onRemove={() => setDeleteDomainId(domain.id)}
              onRefreshDns={() => {
                void (async () => {
                  setRefreshingDns(true);
                  try {
                    await loadOverview();
                  } finally {
                    setRefreshingDns(false);
                  }
                })();
              }}
              onApplyDns={(providerId) => void applyDnsRecord(domain, providerId)}
            />
          ))
        )}
      </section>

      <ConfirmationDialog
        open={Boolean(domainPendingDelete)}
        title="Remove this domain?"
        subject={domainPendingDelete?.hostname}
        description="Traffic will stop routing to this service through this hostname."
        confirmLabel="Remove domain"
        eyebrow="Custom domain"
        busy={busy === "domain"}
        onClose={() => setDeleteDomainId(null)}
        onConfirm={() => {
          if (!domainPendingDelete) return;
          void doAction("domain", async () => {
            await api.deleteDomain(serviceId, domainPendingDelete.id);
            setDeleteDomainId(null);
          });
        }}
      />
    </>
  );
}
