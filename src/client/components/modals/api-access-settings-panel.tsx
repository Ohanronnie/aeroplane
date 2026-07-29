import { Add01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { api, type ApiKeyExpiryDays, type ApiKeyProjectOption, type ApiKeySummary } from "../../api";
import { SettingsDialog } from "../../features/settings/settings-dialog";
import { AppIcon } from "../ui/primitives";
import { ApiKeyCreateForm } from "./api-key-create-form";
import { ApiKeyList } from "./api-key-list";
import { ApiKeySecretReveal } from "./api-key-secret-reveal";

type CreateApiKeyInput = {
  name: string;
  accessLevel: "read" | "write";
  projectScope: "all" | "selected";
  projectIds: string[];
  expiresInDays: ApiKeyExpiryDays;
};

function sortApiKeys(apiKeys: ApiKeySummary[]) {
  return [...apiKeys].sort((a, b) => a.name.localeCompare(b.name));
}

export function ApiAccessSettingsPanel({ open }: { open: boolean }) {
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [projects, setProjects] = useState<ApiKeyProjectOption[]>([]);
  const [createdToken, setCreatedToken] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [error, setError] = useState("");

  async function loadApiKeys() {
    setLoading(true);
    setError("");
    try {
      const result = await api.apiKeys();
      setApiKeys(sortApiKeys(result.apiKeys));
      setProjects(result.projects);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadApiKeys();
  }, [open]);

  async function createKey(input: CreateApiKeyInput) {
    setCreating(true);
    setError("");
    setCreatedToken("");
    try {
      const result = await api.createApiKey(input);
      setCreatedToken(result.token);
      setApiKeys((current) => sortApiKeys([...current, result.apiKey]));
      setCreateOpen(false);
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : "Could not create API key";
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(apiKeyId: string) {
    setRevokingId(apiKeyId);
    setError("");
    try {
      await api.revokeApiKey(apiKeyId);
      setApiKeys((current) => current.filter((apiKey) => apiKey.id !== apiKeyId));
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not revoke API key");
    } finally {
      setRevokingId("");
    }
  }

  return (
    <section className="mx-auto max-w-5xl overflow-hidden border border-white/10 bg-black">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7 lg:px-8">
        <div>
          <h2 className="text-xl tracking-[-0.03em] text-white">Keys</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {loading ? "Loading keys…" : `${apiKeys.length} ${apiKeys.length === 1 ? "key" : "keys"}`}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 w-fit items-center justify-center gap-2 bg-white px-4 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setCreateOpen(true)}
          disabled={loading}
        >
          <AppIcon icon={Add01Icon} size={15} />
          Create API key
        </button>
      </header>

      <ApiKeyList apiKeys={apiKeys} projects={projects} revokingId={revokingId} onRevoke={revokeKey} />

      {error ? (
        <div className="border-t border-white/10 px-5 pb-5 sm:px-7 sm:pb-7 lg:px-8 lg:pb-8">
          <div className="mt-5 border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        </div>
      ) : null}

      <SettingsDialog
        open={createOpen}
        title="Create API key"
        width="max-w-md"
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
      >
        <ApiKeyCreateForm projects={projects} creating={creating || loading} onCreate={createKey} />
      </SettingsDialog>

      <SettingsDialog
        open={Boolean(createdToken)}
        title="New API key"
        width="max-w-xl"
        onClose={() => setCreatedToken("")}
      >
        <ApiKeySecretReveal token={createdToken} onDismiss={() => setCreatedToken("")} />
      </SettingsDialog>
    </section>
  );
}
