import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AiProviderDefinition } from "./ai-settings-data";

function maskedApiKey(keySuffix: string) {
  return keySuffix ? `******${keySuffix}` : "(API key unset)";
}

export function AiProviderApiKeyEditor({
  provider,
  connected,
  keySuffix,
  busy = false,
  onSaveApiKey
}: {
  provider: AiProviderDefinition;
  connected: boolean;
  keySuffix: string;
  busy?: boolean;
  onSaveApiKey: (apiKey: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!editing) return;

    const animationFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [editing]);

  async function commitApiKey() {
    if (savingRef.current) return;

    const apiKey = draft.trim();
    if (!apiKey) {
      setEditing(false);
      setDraft("");
      return;
    }

    savingRef.current = true;
    try {
      await onSaveApiKey(apiKey);
      setEditing(false);
      setDraft("");
    } finally {
      savingRef.current = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitApiKey();
    }
    if (event.key === "Escape") {
      setEditing(false);
      setDraft("");
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="password"
        name={`ai-provider-${provider.id}-api-key`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commitApiKey()}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
        placeholder={provider.apiKeyPlaceholder}
        className="h-11 w-full border border-white/15 bg-white/[0.03] px-3 font-mono text-xs text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-white focus:ring-2 focus:ring-white/10"
        disabled={busy}
        autoComplete="new-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-form-type="other"
        data-lpignore="true"
      />
    );
  }

  return (
    <button
      type="button"
      className="flex h-11 w-full items-center justify-between gap-3 border border-white/15 bg-white/[0.03] px-3 text-left outline-none transition hover:border-white/30 focus:border-white focus:ring-2 focus:ring-white/10 disabled:cursor-wait disabled:opacity-60"
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      disabled={busy}
      title={connected ? "Replace API key" : "Set API key"}
    >
      <span className={`truncate font-mono text-xs ${connected ? "text-zinc-300" : "text-zinc-600"}`}>
        {maskedApiKey(keySuffix)}
      </span>
      <span className="shrink-0 text-xs text-zinc-500">{connected ? "Replace" : "Add key"}</span>
    </button>
  );
}
