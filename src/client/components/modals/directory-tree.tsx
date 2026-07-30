import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import type { GitHubDirectory } from "../../api";
import { AppIcon } from "../ui/primitives";

type DirectoryTreeProps = {
  repoLabel: string;
  selectedPath: string;
  directoriesByPath: Record<string, GitHubDirectory[]>;
  expandedPaths: Set<string>;
  loadingPaths: Set<string>;
  errorMessage?: string;
  footerMessage: string;
  rootLabel?: string;
  onToggle: (path: string) => void | Promise<void>;
  onSelect: (path: string) => void;
};

export function DirectoryTree({
  repoLabel,
  selectedPath,
  directoriesByPath,
  expandedPaths,
  loadingPaths,
  errorMessage,
  footerMessage,
  rootLabel = "Repository root",
  onToggle,
  onSelect
}: DirectoryTreeProps) {
  function renderRows(parentPath = "", level = 0): ReactNode {
    const rows = directoriesByPath[parentPath] ?? [];

    return rows.map((directory) => {
      const isExpanded = expandedPaths.has(directory.path);
      const isSelected = selectedPath === directory.path;
      const isLoading = loadingPaths.has(directory.path);
      const children = isExpanded ? renderRows(directory.path, level + 1) : null;

      return (
        <div key={directory.path}>
          <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5 last:border-b-0">
            <button
              type="button"
              className={`grid h-6 w-6 place-items-center text-zinc-600 ${directory.hasChildren ? "hover:bg-white/[0.05] hover:text-white" : "opacity-40"}`}
              style={{ marginLeft: `${level * 22}px` }}
              onClick={() => (directory.hasChildren ? void onToggle(directory.path) : undefined)}
            >
              {directory.hasChildren ? (
                isLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin border border-zinc-700 border-t-white" />
                ) : (
                  <AppIcon icon={ArrowLeft01Icon} size={14} className={isExpanded ? "rotate-90" : "-rotate-90"} />
                )
              ) : null}
            </button>
            <button
              type="button"
              className={`h-3.5 w-3.5 border ${isSelected ? "border-white bg-white" : "border-zinc-700 bg-transparent"}`}
              onClick={() => onSelect(directory.path)}
            />
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(directory.path)}>
              <div className="truncate text-xs text-zinc-200">{directory.name}</div>
              <div className="mt-0.5 truncate font-mono text-[9px] tracking-[0.08em] text-zinc-600">{directory.path}</div>
            </button>
          </div>
          {children}
        </div>
      );
    });
  }

  return (
    <div className="overflow-hidden border border-white/10 bg-black">
      <div className="border-b border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">{repoLabel}</div>
      <div className="max-h-[360px] overflow-auto">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
          <div className="w-6" />
          <button
            type="button"
            className={`h-3.5 w-3.5 border ${selectedPath === "" ? "border-white bg-white" : "border-zinc-700 bg-transparent"}`}
            onClick={() => onSelect("")}
          />
          <button type="button" className="flex-1 text-left" onClick={() => onSelect("")}>
            <div className="text-xs text-zinc-200">{rootLabel}</div>
          </button>
        </div>
        {renderRows("", 0)}
      </div>
      <div className={`border-t border-white/10 px-3 py-2 font-mono text-[9px] tracking-[0.08em] ${errorMessage ? "text-rose-300" : "text-zinc-600"}`}>{errorMessage || footerMessage}</div>
    </div>
  );
}
