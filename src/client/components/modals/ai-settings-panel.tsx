import { AiBrain01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { api, type AiSettingsStatus } from "../../api";
import { SectionTitle } from "../ui/primitives";
import { AiProviderCard } from "./ai-provider-card";
import { AiProviderForm } from "./ai-provider-form";
import {
  aiProviders,
  createAiConnections,
  createAiCredentials,
  type AiProviderCredentials,
  type AiProviderId
} from "./ai-settings-data";

export function AiSettingsPanel() {
  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>("openai");
  const [defaultProviderId, setDefaultProviderId] = useState<AiProviderId | null>(null);
  const [defaultModel, setDefaultModel] = useState("");
  const [credentials, setCredentials] = useState(createAiCredentials);
  const [connections, setConnections] = useState(createAiConnections);
  const [editingProviderId, setEditingProviderId] = useState<AiProviderId | null>("openai");
  const [credentialError, setCredentialError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyProviderId, setBusyProviderId] = useState<AiProviderId | null>(null);

  const selectedProvider = useMemo(
    () => aiProviders.find((provider) => provider.id === selectedProviderId) ?? aiProviders[0],
    [selectedProviderId]
  );
  const selectedCredentials = credentials[selectedProvider.id];
  const selectedConnection = connections[selectedProvider.id];
  const editingSelectedProvider = editingProviderId === selectedProvider.id || !selectedConnection.connected;
  const selectedProviderBusy = busyProviderId === selectedProvider.id;
  const defaultProvider = defaultProviderId ? aiProviders.find((provider) => provider.id === defaultProviderId) : null;

  function syncAiSettings(ai: AiSettingsStatus) {
    const nextConnections = createAiConnections();
    const nextCredentials = createAiCredentials();

    for (const provider of aiProviders) {
      const status = ai.providers.find((item) => item.id === provider.id);
      if (!status) continue;

      nextConnections[provider.id] = {
        connected: status.connected,
        keySuffix: status.keySuffix,
        selectedModel: status.selectedModel,
        savedAt: status.updatedAt ?? status.connectedAt ?? ""
      };
      nextCredentials[provider.id] = {
        apiKey: status.connected && status.keySuffix ? `******${status.keySuffix}` : "",
        selectedModel: status.selectedModel
      };
    }

    setDefaultProviderId(ai.defaultProvider);
    setDefaultModel(ai.defaultModel);
    setConnections(nextConnections);
    setCredentials(nextCredentials);
    setEditingProviderId((current) => {
      if (current && !nextConnections[current].connected) return current;
      return nextConnections[selectedProviderId].connected ? null : selectedProviderId;
    });
  }

  useEffect(() => {
    let ignore = false;

    async function loadAiSettings() {
      setLoading(true);
      try {
        const response = await api.aiSettings();
        if (!ignore) {
          syncAiSettings(response.ai);
          setCredentialError("");
        }
      } catch (error) {
        if (!ignore) setCredentialError(error instanceof Error ? error.message : "Could not load AI providers.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadAiSettings();
    return () => {
      ignore = true;
    };
  }, []);

  function selectProvider(providerId: AiProviderId) {
    setSelectedProviderId(providerId);
    setCredentialError("");
    if (!connections[providerId].connected) setEditingProviderId(providerId);
  }

  function updateSelectedCredentials(values: AiProviderCredentials) {
    setCredentials((current) => ({
      ...current,
      [selectedProvider.id]: values
    }));
  }

  async function saveSelectedCredentials() {
    if (!selectedCredentials.apiKey.trim()) {
      setCredentialError(`${selectedProvider.name} API key is required.`);
      return;
    }

    setBusyProviderId(selectedProvider.id);
    try {
      const response = await api.updateAiProvider(selectedProvider.id, selectedCredentials);
      syncAiSettings(response.ai);
      setCredentialError("");
      setEditingProviderId(null);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not save ${selectedProvider.name} credentials.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  async function setDefaultProvider() {
    if (!selectedConnection.connected) {
      setCredentialError(`Save a ${selectedProvider.name} API key before setting it as default.`);
      setEditingProviderId(selectedProvider.id);
      return;
    }

    setBusyProviderId(selectedProvider.id);
    try {
      const response = await api.updateAiSettings({
        defaultProvider: selectedProvider.id,
        defaultModel: selectedCredentials.selectedModel || selectedConnection.selectedModel
      });
      syncAiSettings(response.ai);
      setCredentialError("");
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not set ${selectedProvider.name} as default.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  async function disconnectSelectedProvider() {
    setBusyProviderId(selectedProvider.id);
    try {
      const response = await api.disconnectAiProvider(selectedProvider.id);
      syncAiSettings(response.ai);
      setCredentialError("");
      setEditingProviderId(selectedProvider.id);
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not remove ${selectedProvider.name}.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  return (
    <section className="space-y-5 border border-zinc-800 bg-zinc-950/30 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle icon={AiBrain01Icon} title="AI" />
        <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <span className="text-zinc-600">Default</span>
          <span className="text-zinc-200">{defaultProvider ? `${defaultProvider.name} / ${defaultModel}` : "None"}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {aiProviders.map((provider) => (
          <AiProviderCard
            key={provider.id}
            provider={provider}
            selected={provider.id === selectedProvider.id}
            connected={connections[provider.id].connected}
            isDefault={provider.id === defaultProviderId}
            model={connections[provider.id].selectedModel}
            onSelect={() => selectProvider(provider.id)}
          />
        ))}
      </div>

      {loading ? <div className="border border-zinc-800 bg-zinc-900/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Loading AI providers...</div> : null}
      {credentialError && !editingSelectedProvider ? <div className="border border-rose-500/35 bg-rose-950/25 px-3 py-2 font-mono text-[10px] text-rose-200">{credentialError}</div> : null}

      <div className="max-w-4xl">
        <AiProviderForm
          provider={selectedProvider}
          values={selectedCredentials}
          connection={selectedConnection}
          isDefault={selectedProvider.id === defaultProviderId}
          editing={editingSelectedProvider}
          error={credentialError}
          busy={selectedProviderBusy}
          onChange={updateSelectedCredentials}
          onSave={() => void saveSelectedCredentials()}
          onEdit={() => setEditingProviderId(selectedProvider.id)}
          onCancel={() => setEditingProviderId(null)}
          onDisconnect={() => void disconnectSelectedProvider()}
          onSetDefault={() => void setDefaultProvider()}
        />
      </div>
    </section>
  );
}
