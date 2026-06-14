import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import type { AiProviderId } from "../shared/ai-providers.js";

export function modelForAiProvider(providerId: AiProviderId, apiKey: string, modelId: string): LanguageModel {
  if (providerId === "openai") return createOpenAI({ apiKey })(modelId);
  if (providerId === "anthropic") return createAnthropic({ apiKey })(modelId);
  if (providerId === "google") return createGoogleGenerativeAI({ apiKey })(modelId);
  if (providerId === "mistral") return createMistral({ apiKey })(modelId);
  if (providerId === "groq") return createGroq({ apiKey })(modelId);
  if (providerId === "deepseek") return createDeepSeek({ apiKey })(modelId);
  if (providerId === "xai") return createXai({ apiKey }).responses(modelId);

  return createOpenAICompatible({
    name: "moonshot",
    apiKey,
    baseURL: "https://api.moonshot.ai/v1"
  })(modelId);
}

export function providerOptionsForAiProvider(providerId: AiProviderId) {
  return providerId === "xai" ? { xai: { store: false } } : undefined;
}
