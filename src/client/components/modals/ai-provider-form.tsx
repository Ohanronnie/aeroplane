import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  PencilEdit02Icon,
  StarIcon
} from "@hugeicons/core-free-icons";
import type { FormEvent } from "react";
import { AppIcon, FieldLabel, FormInput, shellButton, statusClass } from "../ui/primitives";
import type {
  AiProviderConnection,
  AiProviderCredentials,
  AiProviderDefinition
} from "./ai-settings-data";

function savedLabel(savedAt: string) {
  if (!savedAt) return "Saved in this session";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(savedAt));
}

const selectClass =
  "h-11 w-full border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition focus:border-[#4FB8B2]/60";

export function AiProviderForm({
  provider,
  values,
  connection,
  isDefault,
  editing,
  error,
  busy = false,
  onChange,
  onSave,
  onEdit,
  onCancel,
  onDisconnect,
  onSetDefault
}: {
  provider: AiProviderDefinition;
  values: AiProviderCredentials;
  connection: AiProviderConnection;
  isDefault: boolean;
  editing: boolean;
  error: string;
  busy?: boolean;
  onChange: (values: AiProviderCredentials) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDisconnect: () => void;
  onSetDefault: () => void;
}) {
  function saveCredentials(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    onSave();
  }

  const selectedModel = values.selectedModel || connection.selectedModel || provider.models[0]?.id || "";

  if (connection.connected && !editing) {
    return (
      <section className="space-y-4 border border-zinc-800 bg-zinc-950/45 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center border ${provider.logoFrameClass}`}>
              <img src={provider.logoUrl} alt="" className="max-h-7 max-w-8 object-contain" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">AI provider</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="font-hero text-lg tracking-tight text-zinc-100">{provider.name}</h3>
                <span className={`px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${statusClass(isDefault ? "active" : "current")}`}>
                  {isDefault ? "Default" : "Saved"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isDefault ? (
              <button type="button" className={shellButton("secondary")} onClick={onSetDefault} disabled={busy}>
                <AppIcon icon={StarIcon} size={15} />
                Set default
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-[#4FB8B2]/45 hover:bg-[#4FB8B2]/10 hover:text-[#7fe3dd]"
              onClick={onEdit}
              disabled={busy}
              title="Edit AI credentials"
              aria-label="Edit AI credentials"
            >
              <AppIcon icon={PencilEdit02Icon} size={15} />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-rose-500/45 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={onDisconnect}
              disabled={busy}
              title="Remove AI credentials"
              aria-label="Remove AI credentials"
            >
              <AppIcon icon={Delete02Icon} size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-900/55 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Model</div>
            <div className="mt-2 truncate font-mono text-xs text-zinc-200">{connection.selectedModel}</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/55 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">API key</div>
            <div className="mt-2 font-mono text-xs text-zinc-200">******{connection.keySuffix}</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/55 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Saved</div>
            <div className="mt-2 font-mono text-xs text-zinc-200">{savedLabel(connection.savedAt)}</div>
          </div>
        </div>

        {error ? <div className="border border-rose-500/35 bg-rose-950/25 px-3 py-2 font-mono text-[10px] text-rose-200">{error}</div> : null}
      </section>
    );
  }

  return (
    <form onSubmit={saveCredentials} className="space-y-4 border border-zinc-800 bg-zinc-950/45 p-5">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center border ${provider.logoFrameClass}`}>
          <img src={provider.logoUrl} alt="" className="max-h-7 max-w-8 object-contain" />
        </div>
        <div>
          <h3 className="font-hero text-lg tracking-tight text-zinc-100">{connection.connected ? `Edit ${provider.name}` : `Connect ${provider.name}`}</h3>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>API key</FieldLabel>
          <FormInput
            type="password"
            value={values.apiKey}
            onChange={(event) => onChange({ ...values, apiKey: event.target.value })}
            placeholder={connection.connected ? "Leave masked key or enter a new key" : provider.apiKeyPlaceholder}
            required
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel>Model</FieldLabel>
          <select
            value={selectedModel}
            className={selectClass}
            onChange={(event) => onChange({ ...values, selectedModel: event.target.value })}
          >
            {provider.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="border border-rose-500/35 bg-rose-950/25 px-3 py-2 font-mono text-[10px] text-rose-200">{error}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className={shellButton("primary")} disabled={busy}>
          <AppIcon icon={CheckmarkCircle02Icon} size={15} />
          {busy ? "Saving..." : "Save"}
        </button>
        {connection.connected ? (
          <button type="button" className={shellButton("ghost")} onClick={onCancel} disabled={busy}>
            <AppIcon icon={Cancel01Icon} size={15} />
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
