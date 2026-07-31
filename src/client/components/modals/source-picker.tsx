import { GithubIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import type { GitHubRepo } from "../../api";
import { compareReposByLastPush } from "../../lib/github-repos";
import { ModalShell } from "./modal-shell";
import { AppIcon, FormInput } from "../ui/primitives";

type SourcePickerModalProps = {
  open: boolean;
  query: string;
  repos: GitHubRepo[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (repo: GitHubRepo) => void;
};

export function SourcePickerModal({ open, query, repos, loading, error, onClose, onQueryChange, onSelect }: SourcePickerModalProps) {
  const sortedRepos = useMemo(() => [...repos].sort(compareReposByLastPush), [repos]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={GithubIcon}
      title="Change source"
      meta="GitHub repository"
      width="max-w-2xl"
      minHeight="min-h-0"
      bodyClassName="min-h-0 flex-1"
      variant="monochrome"
    >
      <div className="space-y-3">
        <div className="relative">
          <AppIcon icon={Search01Icon} size={14} className="pointer-events-none absolute left-3 top-[11px] text-zinc-600" />
          <FormInput
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search repositories"
            variant="monochrome"
            className="!h-9 border-white/15 bg-black pl-9 text-xs"
          />
        </div>

        {error ? <div className="border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div> : null}

        <div className="max-h-[380px] overflow-auto border border-white/10 bg-black">
          {repos.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-500">{loading ? "Loading repositories…" : "No repositories found."}</div>
          ) : (
            sortedRepos.map((repo) => (
              <button
                key={repo.id}
                type="button"
                className="group flex w-full items-center justify-between gap-4 border-b border-white/10 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.05]"
                onClick={() => onSelect(repo)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-zinc-200 group-hover:text-white">{repo.name}</div>
                  <div className="mt-0.5 truncate font-mono text-[9px] tracking-[0.08em] text-zinc-600">{repo.fullName}</div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600 group-hover:text-zinc-300">Select</span>
              </button>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}
