import { StarIcon } from "@hugeicons/core-free-icons";
import { AppIcon, FieldLabel } from "../ui/primitives";
import { AiProviderApiKeyEditor } from "./ai-provider-api-key-editor";
import type { AiProviderDefinition } from "./ai-settings-data";
import { AiProviderModelPicker } from "./ai-provider-model-picker";

export function AiProviderDetails({
  provider,
  model,
  connected,
  keySuffix,
  isDefaultModel,
  updating,
  onSelectModel,
  onSaveApiKey,
  onSetDefaultModel
}: {
  provider: AiProviderDefinition;
  model: string;
  connected: boolean;
  keySuffix: string;
  isDefaultModel: boolean;
  updating: boolean;
  onSelectModel: (modelId: string) => void;
  onSaveApiKey: (apiKey: string) => Promise<void> | void;
  onSetDefaultModel: () => void;
}) {
  return (
    <div className="flex min-h-[520px] flex-col">
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center">
          <img src={provider.logoUrl} alt="" className="max-h-9 max-w-11 object-contain" />
        </span>
        <div>
          <h2 className="text-2xl tracking-[-0.03em] text-white">{provider.name}</h2>
          <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em]">
            <span className={`h-1.5 w-1.5 ${connected ? "bg-emerald-400" : "border border-zinc-600"}`} />
            <span className={connected ? "text-emerald-300" : "text-zinc-500"}>
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid max-w-xl gap-5">
        <div>
          <FieldLabel>Model</FieldLabel>
          <AiProviderModelPicker
            provider={provider}
            selectedModel={model}
            busy={updating}
            onSelectModel={onSelectModel}
          />
        </div>

        <div>
          <FieldLabel>API key</FieldLabel>
          <AiProviderApiKeyEditor
            provider={provider}
            connected={connected}
            keySuffix={keySuffix}
            busy={updating}
            onSaveApiKey={onSaveApiKey}
          />
        </div>
      </div>

      <div className="mt-auto max-w-xl border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-200">
              {isDefaultModel ? "Default model" : "Use as default"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {isDefaultModel
                ? `${provider.name} ${model} is used by default.`
                : "Use this provider and model for new AI requests."}
            </div>
          </div>
          <button
            type="button"
            className={
              isDefaultModel
                ? "inline-flex min-h-10 w-fit items-center justify-center gap-2 border border-amber-400/40 bg-amber-400/10 px-4 text-sm text-amber-200"
                : "inline-flex min-h-10 w-fit items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            }
            onClick={onSetDefaultModel}
            disabled={updating || isDefaultModel}
          >
            <AppIcon icon={StarIcon} size={14} className={isDefaultModel ? "fill-amber-300" : ""} />
            {isDefaultModel ? "Default" : "Set as default"}
          </button>
        </div>
      </div>
    </div>
  );
}
