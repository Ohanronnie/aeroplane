import { generateText, Output } from "ai";
import { z } from "zod";
import {
  aiProviderName,
  defaultAiModel,
  isAiProviderModel,
  type AiProviderId
} from "../shared/ai-providers.js";
import { functionRuntimeFileNames, functionRuntimeLabels, type FunctionRuntime } from "../shared/service-functions.js";
import { modelForAiProvider, providerOptionsForAiProvider } from "./ai-models.js";
import type { Service } from "./schema.js";
import { getUserAiSettings } from "./user-settings.js";

const maxPromptChars = 4000;
const maxSourceContextChars = 30000;

const functionCodeGenerationSchema = z.object({
  sourceCode: z.string().min(1)
});

export type FunctionCodeGeneration = z.infer<typeof functionCodeGenerationSchema> & {
  provider: AiProviderId;
  providerName: string;
  model: string;
};

export class FunctionCodeGenerationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FunctionCodeGenerationError";
    this.status = status;
  }
}

function sourceContract(runtime: FunctionRuntime, runtimeMode: Service["runtimeMode"]) {
  const baseRules = [
    "Use only APIs available in the selected native runtime.",
    "Do not import npm, pip, or external package dependencies.",
    "Return a complete source file, not a patch or explanation.",
    "The event object contains method, url, path, query, headers, body, and json.",
    "A normal response may be { status, headers, body }."
  ];

  if (runtime === "python") {
    const workerHint = runtimeMode === "worker"
      ? "For worker services, put any background startup logic at module scope and still define handler(event, context) so the runtime can load the file."
      : "For web services, define handler(event, context) to respond to HTTP requests.";

    return [
      `Runtime: Python (${functionRuntimeFileNames.python})`,
      "Define handler(event, context).",
      "Use only Python standard library modules.",
      workerHint,
      ...baseRules
    ].join("\n");
  }

  const runtimeLabel = functionRuntimeLabels[runtime];
  const workerHint = runtimeMode === "worker"
    ? "For worker services, put any background startup logic at module scope and still export a handler so the runtime can load the file."
    : "For web services, export a handler that responds to HTTP requests.";

  return [
    `Runtime: ${runtimeLabel} (${functionRuntimeFileNames[runtime]})`,
    "Export a default async function handler(event, context), or export a named handler.",
    "Use standard runtime APIs only.",
    workerHint,
    ...baseRules
  ].join("\n");
}

function sourceContext(sourceCode: string) {
  const trimmed = sourceCode.trim();
  if (!trimmed) return "No current source code.";
  if (trimmed.length <= maxSourceContextChars) return trimmed;
  return trimmed.slice(trimmed.length - maxSourceContextChars);
}

function buildPrompt(input: {
  service: Service;
  runtime: FunctionRuntime;
  runtimeMode: Service["runtimeMode"];
  userPrompt: string;
  sourceCode: string;
}) {
  return `Generate function source code for an Aeroplane function service.

Service:
Name: ${input.service.name}
Runtime mode: ${input.runtimeMode}

Source contract:
${sourceContract(input.runtime, input.runtimeMode)}

User request:
${input.userPrompt}

Current source code:
${sourceContext(input.sourceCode)}

Return one complete replacement source file that satisfies the user request.`;
}

export async function generateFunctionSourceCode(
  userId: string,
  service: Service,
  input: {
    prompt: string;
    runtime: FunctionRuntime;
    sourceCode?: string;
    providerId?: AiProviderId;
    modelId?: string;
  }
): Promise<FunctionCodeGeneration> {
  const userPrompt = input.prompt.trim();
  if (!userPrompt) {
    throw new FunctionCodeGenerationError("Describe what the function should do.");
  }
  if (userPrompt.length > maxPromptChars) {
    throw new FunctionCodeGenerationError(`Keep the prompt under ${maxPromptChars} characters.`);
  }

  const aiSettings = getUserAiSettings(userId);
  const providerId = input.providerId || aiSettings?.defaultProvider || "";
  if (!providerId) {
    throw new FunctionCodeGenerationError("Choose a default AI provider in Settings before generating code.", 409);
  }

  const providerSettings = aiSettings?.providers[providerId];
  if (!providerSettings?.apiKey) {
    throw new FunctionCodeGenerationError(`${aiProviderName(providerId)} API key is missing.`, 409);
  }

  const requestedModelId = input.modelId?.trim() || "";
  if (requestedModelId && !isAiProviderModel(providerId, requestedModelId)) {
    throw new FunctionCodeGenerationError(`${requestedModelId} is not a supported ${aiProviderName(providerId)} model.`);
  }

  const defaultProviderModel = providerId === aiSettings?.defaultProvider ? aiSettings?.defaultModel || "" : "";
  const modelId = requestedModelId || defaultProviderModel || providerSettings.selectedModel || defaultAiModel(providerId);
  const result = await generateText({
    model: modelForAiProvider(providerId, providerSettings.apiKey, modelId),
    temperature: 0.25,
    maxOutputTokens: 5000,
    prompt: buildPrompt({
      service,
      runtime: input.runtime,
      runtimeMode: service.runtimeMode,
      userPrompt,
      sourceCode: input.sourceCode ?? ""
    }),
    providerOptions: providerOptionsForAiProvider(providerId),
    output: Output.object({
      schema: functionCodeGenerationSchema,
      name: "function_code_generation"
    })
  });

  const generation = functionCodeGenerationSchema.parse(result.output);
  if (!generation.sourceCode.trim()) {
    throw new FunctionCodeGenerationError("AI returned empty source code. Try a more specific prompt.");
  }

  return {
    sourceCode: generation.sourceCode,
    provider: providerId,
    providerName: aiProviderName(providerId),
    model: modelId
  };
}
