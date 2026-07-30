import { Add01Icon, Cancel01Icon, CheckmarkCircle02Icon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, type DatabaseDataImport, type DatabaseRow, type DatabaseRowsResponse, type DatabaseRuntimeState, type DatabaseTable } from "../../api";
import { AppIcon } from "../ui/primitives";
import { DatabaseInsertSheet } from "./database-insert-sheet";
import { DatabaseImportStatusBanner } from "./database-import-status-banner";
import { RedisDeleteKeyModal } from "./redis-delete-key-modal";
import { RedisDataImportModal } from "./redis-data-import-modal";
import { RedisHashTable } from "./redis-hash-table";
import { RedisKeyActionsMenu } from "./redis-key-actions-menu";
import { RedisTtlPopover } from "./redis-ttl-popover";
import { DatabaseRuntimeStatePanel } from "./database-runtime-state-panel";
import { RedisBrowserToolbar } from "./redis-browser-toolbar";
import { RedisKeyList } from "./redis-key-list";

type RedisInsertMode = "key" | "item";

const numberFormatter = new Intl.NumberFormat();
const redisDatabaseOptions = Array.from({ length: 16 }, (_, database) => ({
  value: String(database),
  label: `DB ${database}`
}));

function valueText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function prettyValue(value: unknown) {
  const text = valueText(value);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function itemCountLabel(table: DatabaseTable | null) {
  if (!table) return "0 items";
  if (table.rowCount === null) return "unknown";
  if (table.schema === "string") return `${numberFormatter.format(table.rowCount)} value`;
  return `${numberFormatter.format(table.rowCount)} item${table.rowCount === 1 ? "" : "s"}`;
}

const redisMetaPillClass = "inline-flex h-7 items-center border border-white/10 bg-white/[0.03] px-2.5 font-mono text-[10px] leading-none tracking-[0.04em] text-zinc-500";

function redisContentText(type: string, rows: DatabaseRow[]) {
  if (type === "string") return valueText(rows[0]?.value);
  if (type === "hash") {
    return JSON.stringify(
      Object.fromEntries(rows.map((row) => [valueText(row.field), row.value ?? ""])),
      null,
      2
    );
  }
  if (type === "list" || type === "set") {
    return JSON.stringify(rows.map((row) => row.value ?? ""), null, 2);
  }
  if (type === "zset") {
    return JSON.stringify(rows.map((row) => ({ member: row.member ?? "", score: row.score ?? 0 })), null, 2);
  }
  return JSON.stringify(rows, null, 2);
}

function redisItemMeta(type: string, row: DatabaseRow) {
  if (type === "hash") return valueText(row.field);
  if (type === "list") return valueText(row.index);
  if (type === "zset") return valueText(row.member);
  return "";
}

function redisItemValue(type: string, row: DatabaseRow) {
  if (type === "zset") return valueText(row.score);
  return valueText(row.value);
}

function redisItemId(type: string, row: DatabaseRow, index: number) {
  if (type === "hash") return `hash:${valueText(row.field)}`;
  if (type === "list") return `list:${valueText(row.index)}`;
  if (type === "set") return `set:${valueText(row.value)}`;
  if (type === "zset") return `zset:${valueText(row.member)}`;
  return `${type}:${index}`;
}

function redisEditDraft(type: string, row: DatabaseRow): Record<string, string> {
  if (type === "hash") return { field: valueText(row.field), value: valueText(row.value) };
  if (type === "zset") return { member: valueText(row.member), score: valueText(row.score) };
  return { value: redisItemValue(type, row) };
}

const redisInlineInputClass = "h-8 min-w-0 border border-white/15 bg-black px-2 font-mono text-xs text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-white";

function RedisItems({
  type,
  rows,
  deleting,
  saving,
  onDeleteItem,
  onSaveItem
}: {
  type: string;
  rows: DatabaseRow[];
  deleting: boolean;
  saving: boolean;
  onDeleteItem: (row: DatabaseRow) => void;
  onSaveItem: (row: DatabaseRow, values: Record<string, string>) => Promise<void> | void;
}) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setConfirmingDeleteId("");
    setEditingItemId("");
    setEditDraft({});
  }, [type, rows]);

  async function saveItem(row: DatabaseRow) {
    await onSaveItem(row, editDraft);
    setEditingItemId("");
    setEditDraft({});
  }

  if (type === "string") {
    const stringRow = rows[0] ?? { value: "" };
    const editing = editingItemId === "string";

    return (
      <div className="relative min-h-0 flex-1 overflow-auto border border-white/10 bg-white/[0.015] p-4">
        {editing ? (
          <div className="flex h-full min-h-48 flex-col gap-3">
            <textarea
              value={editDraft.value ?? ""}
              onChange={(event) => setEditDraft((current) => ({ ...current, value: event.target.value }))}
              className="min-h-0 flex-1 resize-none border border-white/15 bg-black px-3 py-2 font-mono text-xs leading-6 text-zinc-100 outline-none transition focus:border-white"
              spellCheck={false}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void saveItem(stringRow)}
                disabled={saving}
                title="Save value"
                aria-label="Save value"
              >
                <AppIcon icon={CheckmarkCircle02Icon} size={14} />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  setEditingItemId("");
                  setEditDraft({});
                }}
                disabled={saving}
                title="Cancel edit"
                aria-label="Cancel edit"
              >
                <AppIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
              onClick={() => {
                setEditingItemId("string");
                setEditDraft(redisEditDraft("string", stringRow));
              }}
              title="Edit value"
              aria-label="Edit value"
            >
              <AppIcon icon={PencilEdit02Icon} size={14} />
            </button>
            <pre className="whitespace-pre-wrap break-words pr-12 font-mono text-xs leading-6 text-zinc-300">{prettyValue(stringRow.value)}</pre>
          </>
        )}
      </div>
    );
  }

  if (type === "hash") {
    return (
      <RedisHashTable
        rows={rows}
        deleting={deleting}
        saving={saving}
        confirmingDeleteId={confirmingDeleteId}
        editingItemId={editingItemId}
        editDraft={editDraft}
        setConfirmingDeleteId={setConfirmingDeleteId}
        setEditingItemId={setEditingItemId}
        setEditDraft={setEditDraft}
        onDeleteItem={onDeleteItem}
        onSaveItem={onSaveItem}
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto border border-white/10 bg-white/[0.015]">
      {rows.length === 0 ? (
        <div className="flex h-full min-h-48 items-center justify-center px-5 text-center text-sm text-zinc-500">No items in this key.</div>
      ) : rows.map((row, index) => {
        const itemId = redisItemId(type, row, index);
        const confirming = confirmingDeleteId === itemId;
        const editing = editingItemId === itemId;

        return (
          <div key={itemId} className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-xs text-zinc-300 last:border-b-0">
            {editing ? (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {type === "hash" ? (
                    <input
                      value={editDraft.field ?? ""}
                      onChange={(event) => setEditDraft((current) => ({ ...current, field: event.target.value }))}
                      className={`${redisInlineInputClass} w-48 shrink-0`}
                      placeholder="field"
                    />
                  ) : type === "zset" ? (
                    <input
                      value={editDraft.member ?? ""}
                      onChange={(event) => setEditDraft((current) => ({ ...current, member: event.target.value }))}
                      className={`${redisInlineInputClass} w-48 shrink-0`}
                      placeholder="member"
                    />
                  ) : type === "list" ? (
                    <span className="inline-flex max-w-48 shrink-0 items-center border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-zinc-600">
                      <span className="truncate">{redisItemMeta(type, row)}</span>
                    </span>
                  ) : null}
                  <input
                    value={type === "zset" ? editDraft.score ?? "" : editDraft.value ?? ""}
                    onChange={(event) => setEditDraft((current) => ({ ...current, [type === "zset" ? "score" : "value"]: event.target.value }))}
                    className={`${redisInlineInputClass} flex-1`}
                    placeholder={type === "zset" ? "score" : "value"}
                  />
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void saveItem(row)}
                    disabled={saving}
                    title="Save item"
                    aria-label="Save item"
                  >
                    <AppIcon icon={CheckmarkCircle02Icon} size={14} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setEditingItemId("");
                      setEditDraft({});
                    }}
                    disabled={saving}
                    title="Cancel edit"
                    aria-label="Cancel edit"
                  >
                    <AppIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              </>
            ) : confirming ? (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {type !== "set" ? (
                    <span className="inline-flex max-w-48 shrink-0 items-center border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-zinc-600">
                      <span className="truncate">{redisItemMeta(type, row)}</span>
                    </span>
                  ) : null}
                  <span className="min-w-0 break-words font-mono text-xs text-zinc-300">{redisItemValue(type, row)}</span>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-rose-300">Confirm delete?</span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center border border-rose-500/35 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setConfirmingDeleteId("");
                      onDeleteItem(row);
                    }}
                    disabled={deleting}
                    title="Yes, delete item"
                    aria-label="Yes, delete item"
                  >
                    <AppIcon icon={CheckmarkCircle02Icon} size={14} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setConfirmingDeleteId("")}
                    disabled={deleting}
                    title="No, cancel delete"
                    aria-label="No, cancel delete"
                  >
                    <AppIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {type !== "set" ? (
                    <span className="inline-flex max-w-48 shrink-0 items-center border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-zinc-600">
                      <span className="truncate">{redisItemMeta(type, row)}</span>
                    </span>
                  ) : null}
                  <span className="min-w-0 break-words font-mono text-xs text-zinc-300">{redisItemValue(type, row)}</span>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setConfirmingDeleteId("");
                      setEditingItemId(itemId);
                      setEditDraft(redisEditDraft(type, row));
                    }}
                    disabled={saving || deleting}
                    title="Edit item"
                    aria-label="Edit item"
                  >
                    <AppIcon icon={PencilEdit02Icon} size={14} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-500 transition hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setConfirmingDeleteId(itemId)}
                    disabled={deleting}
                    title="Delete item"
                    aria-label="Delete item"
                  >
                    <AppIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RedisBrowserPanel({ serviceId }: { serviceId: string }) {
  const [keys, setKeys] = useState<DatabaseTable[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [rowsResult, setRowsResult] = useState<DatabaseRowsResponse | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState("0");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [runtimeState, setRuntimeState] = useState<DatabaseRuntimeState>("ready");
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertMode, setInsertMode] = useState<RedisInsertMode>("key");
  const [insertError, setInsertError] = useState("");
  const [insertDraft, setInsertDraft] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dataImports, setDataImports] = useState<DatabaseDataImport[]>([]);
  const [dismissedDataImportIds, setDismissedDataImportIds] = useState<Set<string>>(new Set());
  const keysRequestId = useRef(0);
  const rowsRequestId = useRef(0);

  const selectedKeyMeta = useMemo(() => keys.find((key) => key.id === selectedKey) ?? null, [keys, selectedKey]);
  const rowsBelongToSelectedKey = rowsResult?.table === selectedKey;
  const selectedType = selectedKeyMeta?.schema ?? (rowsBelongToSelectedKey ? rowsResult?.rows[0]?.type?.toString() : "") ?? "";
  const rows = rowsBelongToSelectedKey ? rowsResult?.rows ?? [] : [];
  const firstRow = rows[0] ?? {};
  const latestDataImport = dataImports[0] ?? null;
  const activeDataImport = dataImports.find((dataImport) => (
    (dataImport.status === "queued" || dataImport.status === "running") && !dismissedDataImportIds.has(dataImport.id)
  )) ?? null;
  const visibleDataImport = activeDataImport ?? (latestDataImport && !dismissedDataImportIds.has(latestDataImport.id) ? latestDataImport : null);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(keys.map((key) => key.schema).filter(Boolean))).sort();
    return [{ value: "all", label: "All Types" }, ...types.map((type) => ({ value: type, label: type.toUpperCase() }))];
  }, [keys]);

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase();
    return keys.filter((key) => {
      const matchesType = typeFilter === "all" || key.schema === typeFilter;
      const matchesSearch = !query || key.name.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [keys, search, typeFilter]);

  async function loadKeys(logicalDatabase = selectedDatabase, currentKey = selectedKey) {
    const requestId = keysRequestId.current + 1;
    keysRequestId.current = requestId;
    setBusy("keys");
    setError("");
    try {
      const result = await api.databaseTables(serviceId, Number(logicalDatabase));
      if (keysRequestId.current !== requestId) return { tables: [], selected: "" };
      setRuntimeState(result.runtimeState ?? "ready");
      setMessage(result.message ?? "");
      setKeys(result.tables);
      const nextKey = result.tables.find((key) => key.id === currentKey)?.id ?? result.tables[0]?.id ?? "";
      setSelectedKey(nextKey);
      if (result.tables.length === 0 || (result.runtimeState && result.runtimeState !== "ready")) setRowsResult(null);
      return { tables: result.tables, selected: nextKey };
    } catch (issue) {
      if (keysRequestId.current === requestId) setError(issue instanceof Error ? issue.message : "Could not load Redis keys");
      return { tables: [], selected: "" };
    } finally {
      if (keysRequestId.current === requestId) setBusy("");
    }
  }

  async function loadRows(key = selectedKey) {
    if (!key) return;
    const requestId = rowsRequestId.current + 1;
    rowsRequestId.current = requestId;
    setBusy("rows");
    setError("");
    setRowsResult(null);
    try {
      const result = await api.databaseRows(serviceId, key, 200, 0, []);
      if (rowsRequestId.current === requestId) setRowsResult(result);
    } catch (issue) {
      if (rowsRequestId.current === requestId) {
        setError(issue instanceof Error ? issue.message : "Could not load Redis key");
      }
    } finally {
      if (rowsRequestId.current === requestId) setBusy("");
    }
  }

  async function loadDataImports() {
    try {
      const result = await api.databaseDataImports(serviceId);
      setDataImports(result.imports);
    } catch {
      setDataImports([]);
    }
  }

  function openAddKey() {
    setInsertMode("key");
    setInsertDraft({ key: "", logicalDatabase: selectedDatabase, type: "string", field: "", member: "", score: "0", value: "", ttl: "" });
    setInsertError("");
    setInsertOpen(true);
  }

  function openAddItem() {
    if (!selectedKeyMeta) return;
    setInsertMode("item");
    setInsertDraft({
      key: selectedKeyMeta.name,
      logicalDatabase: selectedDatabase,
      type: selectedKeyMeta.schema,
      field: "",
      member: "",
      score: "0",
      value: "",
      ttl: ""
    });
    setInsertError("");
    setInsertOpen(true);
  }

  function insertSheetTitle() {
    if (insertMode === "key") return "Add key";
    if (selectedType === "hash") return "Add hash field";
    if (selectedType === "list") return "Add list item";
    if (selectedType === "set") return "Add set member";
    if (selectedType === "zset") return "Add sorted set member";
    return "Add item";
  }

  function insertButtonLabel() {
    if (insertMode === "key") return "Add key";
    if (selectedType === "set" || selectedType === "zset") return "Add member";
    if (selectedType === "hash") return "Add field";
    return "Add item";
  }

  async function insertRedis(event: FormEvent) {
    event.preventDefault();
    setBusy("insert");
    setInsertError("");
    try {
      const table = insertMode === "item" && selectedKey ? selectedKey : "__new__";
      const result = await api.insertDatabaseRow(serviceId, { table, values: insertDraft });
      setInsertOpen(false);
      const refreshed = await loadKeys(selectedDatabase);
      const nextKey = result.table ?? refreshed.selected;
      if (nextKey) {
        setSelectedKey(nextKey);
        await loadRows(nextKey);
      }
    } catch (issue) {
      setInsertError(issue instanceof Error ? issue.message : "Could not add Redis key");
    } finally {
      setBusy("");
    }
  }

  async function copyRedisText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function deleteSelectedKey() {
    if (!selectedKeyMeta) return;

    setBusy("delete");
    setError("");
    try {
      await api.deleteDatabaseRow(serviceId, { table: selectedKey, primaryKey: { key: selectedKeyMeta.name } });
      setDeleteOpen(false);
      const refreshed = await loadKeys(selectedDatabase);
      if (refreshed.selected) {
        await loadRows(refreshed.selected);
      } else {
        setRowsResult(null);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete Redis key");
    } finally {
      setBusy("");
    }
  }

  async function deleteRedisItem(row: DatabaseRow) {
    if (!selectedKeyMeta || !selectedKey) return;

    setBusy("delete");
    setError("");
    try {
      await api.deleteDatabaseRow(serviceId, {
        table: selectedKey,
        primaryKey: { ...row, key: selectedKeyMeta.name, type: selectedType }
      });
      const refreshed = await loadKeys(selectedDatabase);
      const nextKey = refreshed.tables.find((key) => key.id === selectedKey)?.id ?? refreshed.selected;
      if (nextKey) {
        await loadRows(nextKey);
      } else {
        setRowsResult(null);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not delete Redis item");
    } finally {
      setBusy("");
    }
  }

  async function saveRedisItem(row: DatabaseRow, values: Record<string, string>) {
    if (!selectedKeyMeta || !selectedKey) return;

    setBusy("save");
    setError("");
    try {
      await api.updateDatabaseRow(serviceId, {
        table: selectedKey,
        primaryKey: { ...row, key: selectedKeyMeta.name, type: selectedType },
        values
      });
      const refreshed = await loadKeys(selectedDatabase);
      const nextKey = refreshed.tables.find((key) => key.id === selectedKey)?.id ?? refreshed.selected;
      if (nextKey) {
        await loadRows(nextKey);
      } else {
        setRowsResult(null);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save Redis item");
    } finally {
      setBusy("");
    }
  }

  async function saveRedisTtl(ttl: number) {
    if (!selectedKeyMeta || !selectedKey) return;

    setBusy("ttl");
    setError("");
    try {
      await api.updateDatabaseRow(serviceId, {
        table: selectedKey,
        primaryKey: { key: selectedKeyMeta.name },
        values: { ttl }
      });
      await loadRows(selectedKey);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not save Redis TTL");
    } finally {
      setBusy("");
    }
  }

  async function refreshAfterImport() {
    rowsRequestId.current += 1;
    setSelectedKey("");
    setRowsResult(null);
    await loadDataImports();
    const refreshed = await loadKeys(selectedDatabase, "");
    if (refreshed.selected) {
      await loadRows(refreshed.selected);
    }
  }

  useEffect(() => {
    keysRequestId.current += 1;
    rowsRequestId.current += 1;
    setSelectedDatabase("0");
    setKeys([]);
    setSelectedKey("");
    setRowsResult(null);
    setRuntimeState("ready");
    setMessage("");
    setImportOpen(false);
    setDataImports([]);
    setDismissedDataImportIds(new Set());
    void loadKeys("0", "");
    void loadDataImports();
  }, [serviceId]);

  useEffect(() => {
    const activeImport = dataImports.some((dataImport) => dataImport.status === "queued" || dataImport.status === "running");
    if (!activeImport) return;

    const interval = window.setInterval(() => {
      void loadDataImports();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [dataImports, serviceId]);

  useEffect(() => {
    if (selectedKey) void loadRows(selectedKey);
  }, [selectedKey]);

  function changeDatabase(database: string) {
    keysRequestId.current += 1;
    rowsRequestId.current += 1;
    setSelectedDatabase(database);
    setKeys([]);
    setSelectedKey("");
    setRowsResult(null);
    setTypeFilter("all");
    setSearch("");
    void loadKeys(database, "");
  }

  const hasRuntimeNotice = runtimeState !== "ready";

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col overflow-hidden border border-white/10 bg-black">
      <RedisBrowserToolbar
        selectedDatabase={selectedDatabase}
        databaseOptions={redisDatabaseOptions}
        typeFilter={typeFilter}
        typeOptions={typeOptions}
        search={search}
        keyCount={keys.length}
        loading={busy === "keys"}
        disabled={hasRuntimeNotice || busy === "keys"}
        onDatabaseChange={changeDatabase}
        onTypeChange={setTypeFilter}
        onSearchChange={setSearch}
        onRefresh={() => void loadKeys(selectedDatabase)}
        onImport={() => setImportOpen(true)}
        onAddKey={openAddKey}
      />

      {error || visibleDataImport ? (
        <div className="border-b border-white/10 px-4 pt-4 sm:px-5">
          {error ? <div className="mb-4 border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div> : null}
          {visibleDataImport ? (
            <DatabaseImportStatusBanner
              dataImport={visibleDataImport}
              onDismiss={() => setDismissedDataImportIds((current) => new Set(current).add(visibleDataImport.id))}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <RedisKeyList
          keys={filteredKeys}
          selectedKey={selectedKey}
          loading={busy === "keys"}
          runtimeUnavailable={hasRuntimeNotice}
          onSelect={(key) => {
            if (selectedKey === key.id) return;
            rowsRequestId.current += 1;
            setRowsResult(null);
            setSelectedKey(key.id);
          }}
        />

        <div className="flex min-h-0 flex-col bg-black">
          {hasRuntimeNotice ? (
            <DatabaseRuntimeStatePanel
              state={runtimeState}
              message={message}
              busy={busy === "keys"}
              onRefresh={() => void loadKeys(selectedDatabase)}
            />
          ) : !selectedKeyMeta ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-5 text-center text-xs text-zinc-600">Choose a key to inspect its value.</div>
          ) : busy === "rows" && !rowsBelongToSelectedKey ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-5 text-center text-xs text-zinc-600">Loading key…</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <h3 className="truncate font-mono text-sm text-white">{selectedKeyMeta.name}</h3>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <span className={`${redisMetaPillClass} uppercase text-zinc-300`}>{selectedType || "unknown"}</span>
                    {selectedType !== "string" ? (
                      <span className={redisMetaPillClass}>{itemCountLabel(selectedKeyMeta)}</span>
                    ) : null}
                    {selectedType === "string" && firstRow.bytes !== undefined ? (
                      <span className={redisMetaPillClass}>Size: {numberFormatter.format(Number(firstRow.bytes))} B</span>
                    ) : null}
                    <RedisTtlPopover ttl={firstRow.ttl} busy={busy === "ttl"} onSave={saveRedisTtl} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedType && selectedType !== "string" ? (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                      onClick={openAddItem}
                      disabled={busy === "insert"}
                      title="Add item"
                      aria-label="Add item"
                    >
                      <AppIcon icon={Add01Icon} size={15} />
                    </button>
                  ) : null}
                  <RedisKeyActionsMenu
                    disabled={busy === "delete"}
                    onCopyContent={() => copyRedisText(redisContentText(selectedType, rows))}
                    onCopyKey={() => copyRedisText(selectedKeyMeta.name)}
                    onDelete={() => setDeleteOpen(true)}
                  />
                </div>
              </div>
              <div className="flex min-h-0 flex-1 p-4 sm:p-5">
                <RedisItems
                  type={selectedType}
                  rows={rows}
                  deleting={busy === "delete"}
                  saving={busy === "save"}
                  onDeleteItem={(row) => void deleteRedisItem(row)}
                  onSaveItem={(row, values) => saveRedisItem(row, values)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {insertOpen ? (
        <DatabaseInsertSheet
          engine="redis"
          title={insertSheetTitle()}
          subtitle={insertMode === "item" ? selectedKeyMeta?.name ?? "Redis key" : "Redis"}
          buttonLabel={insertButtonLabel()}
          columns={[]}
          draft={insertDraft}
          error={insertError}
          busy={busy}
          redisMode={insertMode}
          onDraftChange={setInsertDraft}
          onSubmit={insertRedis}
          onClose={() => {
            setInsertOpen(false);
            setInsertError("");
          }}
        />
      ) : null}

      <RedisDeleteKeyModal
        open={deleteOpen}
        keyName={selectedKeyMeta?.name ?? ""}
        busy={busy === "delete"}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteSelectedKey}
      />

      <RedisDataImportModal
        open={importOpen}
        serviceId={serviceId}
        onClose={() => setImportOpen(false)}
        onImported={refreshAfterImport}
      />
    </div>
  );
}
