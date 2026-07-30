import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { FormEvent } from "react";
import type { DatabaseColumn } from "../../api";
import { Dropdown } from "../ui/dropdown";
import { AppIcon, FormInput } from "../ui/primitives";

const redisTypeOptions = [
  { value: "string", label: "String" },
  { value: "hash", label: "Hash" },
  { value: "list", label: "List" },
  { value: "set", label: "Set" },
  { value: "zset", label: "Sorted set" }
];

const insertLabelClass = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600";
const insertInputClass = "!h-9 border-white/15 bg-black text-xs";

export function validRedisType(value: string) {
  return redisTypeOptions.some((option) => option.value === value);
}

function RedisValueFields({
  type,
  draft,
  onDraftChange
}: {
  type: string;
  draft: Record<string, string>;
  onDraftChange: (draft: Record<string, string>) => void;
}) {
  if (type === "hash") {
    return (
      <>
        <label className="block">
          <span className={insertLabelClass}>Field</span>
          <FormInput value={draft.field ?? ""} onChange={(event) => onDraftChange({ ...draft, field: event.target.value })} placeholder="name" required variant="monochrome" className={insertInputClass} />
        </label>
        <label className="block">
          <span className={insertLabelClass}>Value</span>
          <FormInput value={draft.value ?? ""} onChange={(event) => onDraftChange({ ...draft, value: event.target.value })} placeholder="value" variant="monochrome" className={insertInputClass} />
        </label>
      </>
    );
  }

  if (type === "zset") {
    return (
      <>
        <label className="block">
          <span className={insertLabelClass}>Member</span>
          <FormInput value={draft.member ?? ""} onChange={(event) => onDraftChange({ ...draft, member: event.target.value })} placeholder="member" required variant="monochrome" className={insertInputClass} />
        </label>
        <label className="block">
          <span className={insertLabelClass}>Score</span>
          <FormInput value={draft.score ?? ""} onChange={(event) => onDraftChange({ ...draft, score: event.target.value })} placeholder="0" variant="monochrome" className={insertInputClass} />
        </label>
      </>
    );
  }

  return (
    <label className="block">
      <span className={insertLabelClass}>{type === "list" ? "Item value" : type === "set" ? "Member" : "Value"}</span>
      <FormInput value={draft.value ?? ""} onChange={(event) => onDraftChange({ ...draft, value: event.target.value })} placeholder="value" variant="monochrome" className={insertInputClass} />
    </label>
  );
}

export function DatabaseInsertSheet({
  engine,
  title,
  subtitle,
  buttonLabel,
  columns,
  draft,
  error,
  busy,
  redisMode = "key",
  onDraftChange,
  onClose,
  onSubmit
}: {
  engine: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  columns: DatabaseColumn[];
  draft: Record<string, string>;
  error: string;
  busy: string;
  redisMode?: "key" | "item";
  onDraftChange: (draft: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const isRedis = engine === "redis";
  const isMongo = engine === "mongodb" || engine === "mongo";
  const redisType = draft.type ?? "string";

  return (
    <div className="fixed inset-0 z-[60] bg-black/75">
      <aside className="absolute inset-y-0 right-0 w-full max-w-md border-l border-white/15 bg-black shadow-[-24px_0_60px_rgba(0,0,0,0.55)]">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg tracking-[-0.03em] text-white">{title}</h2>
              <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">{subtitle}</p>
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <AppIcon icon={Cancel01Icon} size={15} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {error ? (
            <div className="mb-4 border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>
          ) : null}
          {isRedis ? (
            <div className="space-y-3">
              {redisMode === "key" ? (
                <>
                  <label className="block">
                    <span className={insertLabelClass}>Key</span>
                    <FormInput value={draft.key ?? ""} onChange={(event) => onDraftChange({ ...draft, key: event.target.value })} placeholder="session:example" required variant="monochrome" className={`${insertInputClass} font-mono`} />
                  </label>
                  <label className="block">
                    <span className={insertLabelClass}>Type</span>
                    <Dropdown value={redisType} options={redisTypeOptions} onChange={(type) => onDraftChange({ ...draft, type })} variant="monochrome" size="compact" className="[&>button]:!h-9" />
                  </label>
                </>
              ) : null}
              <RedisValueFields type={redisType} draft={draft} onDraftChange={onDraftChange} />
              {redisMode === "key" ? (
                <label className="block">
                  <span className={insertLabelClass}>TTL seconds</span>
                  <FormInput value={draft.ttl ?? ""} onChange={(event) => onDraftChange({ ...draft, ttl: event.target.value })} placeholder="No expiry" inputMode="numeric" variant="monochrome" className={insertInputClass} />
                </label>
              ) : null}
            </div>
          ) : isMongo ? (
            <div className="space-y-4">
              <label className="block">
                <span className={insertLabelClass}>Database</span>
                <FormInput value={draft.database ?? ""} onChange={(event) => onDraftChange({ ...draft, database: event.target.value })} placeholder="aeroplane" required variant="monochrome" className={insertInputClass} />
              </label>
              <label className="block">
                <span className={insertLabelClass}>Collection</span>
                <FormInput value={draft.collection ?? ""} onChange={(event) => onDraftChange({ ...draft, collection: event.target.value })} placeholder="users" required variant="monochrome" className={insertInputClass} />
              </label>
              <label className="block">
                <span className={insertLabelClass}>Document JSON</span>
                <textarea
                  value={draft.document ?? ""}
                  onChange={(event) => onDraftChange({ ...draft, document: event.target.value })}
                  className="min-h-56 w-full resize-none border border-white/15 bg-black px-3 py-2 font-mono text-xs text-zinc-100 outline-none transition focus:border-white"
                  spellCheck={false}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {columns.map((column) => (
                <label key={column.name} className="block">
                  <span className={insertLabelClass}>{column.name}</span>
                  <FormInput value={draft[column.name] ?? ""} onChange={(event) => onDraftChange({ ...draft, [column.name]: event.target.value })} placeholder={column.type} variant="monochrome" className={insertInputClass} />
                </label>
              ))}
            </div>
          )}
          </div>
          <footer className="border-t border-white/10 p-5">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:opacity-40"
              disabled={busy === "insert"}
            >
            {buttonLabel}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
