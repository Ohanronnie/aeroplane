import type { DnsProviderDefinition } from "./dns-management-data";
import { DnsProviderLogo } from "./dns-provider-logo";

export function DnsProviderCard({
  provider,
  selected,
  connected,
  onSelect
}: {
  provider: DnsProviderDefinition;
  selected: boolean;
  connected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`mb-1 flex min-h-20 w-full items-center justify-between gap-3 border-l-2 px-3 py-3 text-left transition ${
        selected
          ? "border-white bg-white/[0.08]"
          : "border-transparent bg-transparent hover:bg-white/[0.04]"
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center">
          <DnsProviderLogo provider={provider} className="max-h-6 max-w-8" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-zinc-100">{provider.name}</span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <span className={`h-1.5 w-1.5 ${connected ? "bg-white" : "border border-zinc-600"}`} />
        <span className="sr-only">{connected ? "Connected" : "Not connected"}</span>
      </span>
    </button>
  );
}
