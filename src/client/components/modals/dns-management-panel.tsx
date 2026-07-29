import { useEffect, useMemo, useState } from "react";
import { api, type DnsSettingsStatus } from "../../api";
import {
  blankCredentials,
  createDnsConnections,
  createDnsCredentials,
  dnsProviders,
  type DnsCredentialValues,
  type DnsProviderId
} from "./dns-management-data";
import { DnsCredentialsForm } from "./dns-credentials-form";
import { DnsProviderCard } from "./dns-provider-card";

export function DnsManagementPanel() {
  const [selectedProviderId, setSelectedProviderId] = useState<DnsProviderId>("cloudflare");
  const [credentials, setCredentials] = useState(createDnsCredentials);
  const [connections, setConnections] = useState(createDnsConnections);
  const [editingProviderId, setEditingProviderId] = useState<DnsProviderId | null>("cloudflare");
  const [credentialError, setCredentialError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyProviderId, setBusyProviderId] = useState<DnsProviderId | null>(null);

  const selectedProvider = useMemo(
    () => dnsProviders.find((provider) => provider.id === selectedProviderId) ?? dnsProviders[0],
    [selectedProviderId]
  );
  const selectedCredentials = credentials[selectedProvider.id];
  const selectedConnection = connections[selectedProvider.id];
  const editingSelectedProvider = editingProviderId === selectedProvider.id || !selectedConnection.connected;
  const selectedProviderBusy = busyProviderId === selectedProvider.id;
  const connectedProviderCount = dnsProviders.filter((provider) => connections[provider.id].connected).length;

  function syncDnsSettings(dns: DnsSettingsStatus) {
    const nextConnections = createDnsConnections();
    const nextCredentials = createDnsCredentials();

    for (const provider of dnsProviders) {
      const status = dns.providers.find((item) => item.id === provider.id);
      if (!status) continue;

      nextConnections[provider.id] = {
        connected: status.connected,
        keySuffix: status.keySuffix,
        savedAt: status.updatedAt ?? status.connectedAt ?? ""
      };

      const values = blankCredentials(provider);
      for (const field of provider.fields) {
        if (status.values[field.key]) {
          values[field.key] = status.values[field.key];
        } else if (field.type === "password" && status.secretSuffixes[field.key]) {
          values[field.key] = `******${status.secretSuffixes[field.key]}`;
        }
      }
      nextCredentials[provider.id] = values;
    }

    setConnections(nextConnections);
    setCredentials(nextCredentials);
    setEditingProviderId((current) => {
      if (current && !nextConnections[current].connected) return current;
      return nextConnections[selectedProviderId].connected ? null : selectedProviderId;
    });
  }

  useEffect(() => {
    let ignore = false;

    async function loadDnsSettings() {
      setLoading(true);
      try {
        const response = await api.dnsSettings();
        if (!ignore) {
          syncDnsSettings(response.dns);
          setCredentialError("");
        }
      } catch (error) {
        if (!ignore) setCredentialError(error instanceof Error ? error.message : "Could not load DNS providers.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadDnsSettings();
    return () => {
      ignore = true;
    };
  }, []);

  function selectProvider(providerId: DnsProviderId) {
    setSelectedProviderId(providerId);
    setCredentialError("");
    if (!connections[providerId].connected) setEditingProviderId(providerId);
  }

  function updateSelectedCredentials(values: DnsCredentialValues) {
    setCredentials((current) => ({
      ...current,
      [selectedProvider.id]: values
    }));
  }

  async function saveSelectedCredentials() {
    const missingField = selectedProvider.fields.find((field) => field.required && !selectedCredentials[field.key]?.trim());
    if (missingField) {
      setCredentialError(`${missingField.label} is required.`);
      return;
    }

    setBusyProviderId(selectedProvider.id);
    try {
      const response = await api.updateDnsProvider(selectedProvider.id, selectedCredentials);
      syncDnsSettings(response.dns);
      setCredentialError("");
      setEditingProviderId(null);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not save ${selectedProvider.name} credentials.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  async function disconnectSelectedProvider() {
    setBusyProviderId(selectedProvider.id);
    try {
      const response = await api.disconnectDnsProvider(selectedProvider.id);
      syncDnsSettings(response.dns);
      setCredentialError("");
      setEditingProviderId(selectedProvider.id);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not disconnect ${selectedProvider.name}.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  return (
    <section className="mx-auto max-w-5xl overflow-hidden border border-white/10 bg-black">
      <div className="grid min-h-[560px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-white/[0.02] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <span className="text-sm text-white">Providers</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              {connectedProviderCount} connected
            </span>
          </div>

          <div className="p-2">
            {dnsProviders.map((provider) => (
              <DnsProviderCard
                key={provider.id}
                provider={provider}
                selected={provider.id === selectedProvider.id}
                connected={connections[provider.id].connected}
                onSelect={() => selectProvider(provider.id)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7 lg:p-8">
          {loading ? (
            <div className="space-y-5" aria-label="Loading DNS providers">
              <div className="h-14 w-52 animate-pulse bg-white/5" />
              <div className="grid max-w-xl gap-4">
                {selectedProvider.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="h-3 w-20 animate-pulse bg-white/5" />
                    <div className="h-11 animate-pulse border border-white/10 bg-white/[0.03]" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {credentialError && !editingSelectedProvider ? (
                <div className="mb-5 border-l-2 border-white bg-white/[0.06] px-4 py-3 text-sm text-zinc-200">
                  {credentialError}
                </div>
              ) : null}

              <DnsCredentialsForm
                provider={selectedProvider}
                values={selectedCredentials}
                connection={selectedConnection}
                editing={editingSelectedProvider}
                error={credentialError}
                busy={selectedProviderBusy}
                onChange={updateSelectedCredentials}
                onSave={() => void saveSelectedCredentials()}
                onEdit={() => setEditingProviderId(selectedProvider.id)}
                onCancel={() => setEditingProviderId(null)}
                onDisconnect={() => void disconnectSelectedProvider()}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
