import type { AiProviderStatus, AiSettingsStatus } from "../../api";

export function connectedAiProviders(aiSettings: AiSettingsStatus | null) {
  return aiSettings?.providers.filter((provider) => provider.connected) ?? [];
}

export function initialAiProvider(aiSettings: AiSettingsStatus) {
  const providers = connectedAiProviders(aiSettings);
  return providers.find((provider) => provider.id === aiSettings.defaultProvider) ?? providers[0] ?? null;
}

export function modelForAiProvider(provider: AiProviderStatus | null, aiSettings: AiSettingsStatus | null) {
  if (!provider) return "";
  if (provider.id === aiSettings?.defaultProvider && aiSettings.defaultModel) return aiSettings.defaultModel;
  return provider.selectedModel || provider.models[0]?.id || "";
}
