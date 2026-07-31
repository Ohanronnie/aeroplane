import type { FormEvent } from "react";
import { SettingsDialog } from "../settings/settings-dialog";

export function EditProjectModal({
  open,
  name,
  description,
  projectSlug,
  saving,
  error,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSave
}: {
  open: boolean;
  name: string;
  description: string;
  projectSlug: string;
  saving: boolean;
  error: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <SettingsDialog
      open={open}
      title="Edit project"
      width="max-w-lg"
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={submit}>
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">
          {projectSlug}
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Update the name and description shown across this project.
        </p>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
              Project name
            </span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              autoComplete="off"
              autoFocus
              required
              className="h-11 w-full border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 hover:border-white/30 focus:border-white focus:bg-white/[0.07]"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                Description
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-700">
                Optional
              </span>
            </span>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="What is this project for?"
              rows={4}
              className="w-full resize-none border border-white/15 bg-white/[0.04] px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 hover:border-white/30 focus:border-white focus:bg-white/[0.07]"
            />
          </label>
        </div>

        {error ? (
          <div role="alert" className="mt-5 border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center bg-white px-5 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving…" : "Save project"}
          </button>
        </div>
      </form>
    </SettingsDialog>
  );
}
