import { useEffect, useMemo, useState } from "react";
import { api, type AiSettingsStatus } from "../../api";
import { AiProviderCard } from "./ai-provider-card";
import { AiProviderDetails } from "./ai-provider-details";
import {
  aiProviders,
  createAiConnections,
  type AiProviderId
} from "./ai-settings-data";

export function AiSettingsPanel() {
  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>("openai");
  const [defaultProviderId, setDefaultProviderId] = useState<AiProviderId | null>(null);
  const [defaultModel, setDefaultModel] = useState("");
  const [connections, setConnections] = useState(createAiConnections);
  const [credentialError, setCredentialError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyProviderId, setBusyProviderId] = useState<AiProviderId | null>(null);

  const selectedProvider = useMemo(
    () => aiProviders.find((provider) => provider.id === selectedProviderId) ?? aiProviders[0],
    [selectedProviderId]
  );
  const selectedConnection = connections[selectedProvider.id];
  const selectedProviderIsDefault =
    selectedProvider.id === defaultProviderId &&
    selectedConnection.selectedModel === defaultModel;
  const connectedProviderCount = aiProviders.filter(
    (provider) => connections[provider.id].connected
  ).length;

  function syncAiSettings(ai: AiSettingsStatus) {
    const nextConnections = createAiConnections();

    for (const provider of aiProviders) {
      const status = ai.providers.find((item) => item.id === provider.id);
      if (!status) continue;

      nextConnections[provider.id] = {
        connected: status.connected,
        keySuffix: status.keySuffix,
        selectedModel: status.selectedModel,
        savedAt: status.updatedAt ?? status.connectedAt ?? ""
      };
    }

    setDefaultProviderId(ai.defaultProvider);
    setDefaultModel(ai.defaultModel);
    setConnections(nextConnections);
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
  }

  function updateProviderModelDraft(providerId: AiProviderId, modelId: string) {
    setConnections((current) => ({
      ...current,
      [providerId]: {
        ...current[providerId],
        selectedModel: modelId
      }
    }));
    if (defaultProviderId === providerId) setDefaultModel(modelId);
  }

  async function updateProviderModel(providerId: AiProviderId, modelId: string) {
    if (connections[providerId].selectedModel === modelId) return;

    const provider = aiProviders.find((item) => item.id === providerId);
    const previousConnection = connections[providerId];
    const previousDefaultModel = defaultModel;
    updateProviderModelDraft(providerId, modelId);

    if (!previousConnection.connected) {
      setSelectedProviderId(providerId);
      setCredentialError("");
      return;
    }

    setBusyProviderId(providerId);
    try {
      const response = await api.updateAiProvider(providerId, { apiKey: "", selectedModel: modelId });
      syncAiSettings(response.ai);
      setCredentialError("");
    } catch (error) {
      setConnections((current) => ({ ...current, [providerId]: previousConnection }));
      setDefaultModel(previousDefaultModel);
      setCredentialError(error instanceof Error ? error.message : `Could not update ${provider?.name ?? providerId} model.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  async function updateProviderApiKey(providerId: AiProviderId, apiKey: string) {
    const provider = aiProviders.find((item) => item.id === providerId);
    const selectedModel = connections[providerId].selectedModel;

    setBusyProviderId(providerId);
    try {
      const response = await api.updateAiProvider(providerId, { apiKey, selectedModel });
      syncAiSettings(response.ai);
      setCredentialError("");
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : `Could not save ${provider?.name ?? providerId} API key.`);
      throw error;
    } finally {
      setBusyProviderId(null);
    }
  }

  async function updateDefaultModel(providerId: AiProviderId) {
    const connection = connections[providerId];
    const provider = aiProviders.find((item) => item.id === providerId);
    const modelId = connection.selectedModel;
    if (defaultProviderId === providerId && defaultModel === modelId) return;

    if (!connection.connected) {
      setSelectedProviderId(providerId);
      setCredentialError(`Save a ${provider?.name ?? providerId} API key before setting it as default.`);
      return;
    }

    const previousDefaultProvider = defaultProviderId;
    const previousDefaultModel = defaultModel;
    setDefaultProviderId(providerId);
    setDefaultModel(modelId);
    setBusyProviderId(providerId);

    try {
      const response = await api.updateAiSettings({ defaultProvider: providerId, defaultModel: modelId });
      syncAiSettings(response.ai);
      setCredentialError("");
    } catch (error) {
      setDefaultProviderId(previousDefaultProvider);
      setDefaultModel(previousDefaultModel);
      setCredentialError(error instanceof Error ? error.message : `Could not set ${provider?.name ?? providerId} as default.`);
    } finally {
      setBusyProviderId(null);
    }
  }

  return (
    <section className="mx-auto max-w-5xl overflow-hidden border border-white/10 bg-black">
      <div className="grid min-h-[640px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-white/[0.02] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <span className="text-sm text-white">Providers</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              {connectedProviderCount} connected
            </span>
          </div>

          <div className="p-2">
            {aiProviders.map((provider) => (
              <AiProviderCard
                key={provider.id}
                provider={provider}
                selected={provider.id === selectedProvider.id}
                connected={connections[provider.id].connected}
                isDefaultModel={
                  provider.id === defaultProviderId &&
                  connections[provider.id].selectedModel === defaultModel
                }
                onSelect={() => selectProvider(provider.id)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7 lg:p-8">
          {credentialError ? (
            <div className="mb-5 border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {credentialError}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-7" aria-label="Loading AI providers">
              <div className="h-14 w-48 animate-pulse bg-white/5" />
              <div className="grid max-w-xl gap-5">
                <div className="h-11 animate-pulse border border-white/10 bg-white/[0.03]" />
                <div className="h-11 animate-pulse border border-white/10 bg-white/[0.03]" />
              </div>
            </div>
          ) : (
            <AiProviderDetails
              provider={selectedProvider}
              model={selectedConnection.selectedModel}
              connected={selectedConnection.connected}
              keySuffix={selectedConnection.keySuffix}
              isDefaultModel={selectedProviderIsDefault}
              updating={busyProviderId === selectedProvider.id}
              onSelectModel={(modelId) => void updateProviderModel(selectedProvider.id, modelId)}
              onSaveApiKey={(apiKey) => updateProviderApiKey(selectedProvider.id, apiKey)}
              onSetDefaultModel={() => void updateDefaultModel(selectedProvider.id)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
