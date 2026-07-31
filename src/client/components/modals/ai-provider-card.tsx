import { StarIcon } from "@hugeicons/core-free-icons";
import { AppIcon } from "../ui/primitives";
import type { AiProviderDefinition } from "./ai-settings-data";

export function AiProviderCard({
  provider,
  selected,
  connected,
  isDefaultModel,
  onSelect
}: {
  provider: AiProviderDefinition;
  selected: boolean;
  connected: boolean;
  isDefaultModel: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`mb-1 flex min-h-16 w-full items-center justify-between gap-3 border-l-2 px-3 py-2.5 text-left transition ${
        selected
          ? "border-white bg-white/[0.08]"
          : "border-transparent bg-transparent hover:bg-white/[0.04]"
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center">
          <img src={provider.logoUrl} alt="" className="max-h-6 max-w-7 object-contain" loading="lazy" />
        </span>
        <span className="truncate text-sm text-zinc-100">{provider.name}</span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {isDefaultModel ? <AppIcon icon={StarIcon} size={12} className="fill-amber-300 text-amber-300" /> : null}
        <span className={`h-1.5 w-1.5 ${connected ? "bg-emerald-400" : "border border-zinc-600"}`} />
        <span className="sr-only">
          {connected ? "Connected" : "Not connected"}
          {isDefaultModel ? ", default provider" : ""}
        </span>
      </span>
    </button>
  );
}
