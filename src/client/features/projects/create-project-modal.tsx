import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { type FormEvent, useEffect, useState } from "react";
import { AppIcon } from "../../components/ui/primitives";

export function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) return;
    setForm({ name: "", description: "" });
    setBusy(false);
    setError("");
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onCreate({
        name: form.name,
        description: form.description || undefined,
      });
      onClose();
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Could not create project",
      );
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
          className="w-full max-w-xl border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-8"
        >
          <header className="flex items-start justify-between gap-5">
            <h2
              id="create-project-title"
              className="pb-1 font-hero text-xl leading-[1.3] tracking-[-0.04em]"
            >
              Create a new project
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="grid h-9 w-9 flex-none place-items-center border border-white/10 text-zinc-500 transition hover:border-white/25 hover:text-white disabled:opacity-50"
              aria-label="Close create project modal"
            >
              <AppIcon icon={Cancel01Icon} size={15} />
            </button>
          </header>

          <form onSubmit={submit} className="mt-7">
            <div className="grid gap-y-5">
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Project name
                </span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Acme platform"
                  autoComplete="off"
                  required
                  autoFocus
                  className="h-12 w-full border border-white/15 bg-white/5 px-3.5 text-[15px] text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Description
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                    Optional
                  </span>
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Internal tools and APIs"
                  rows={4}
                  className="w-full resize-y border border-white/15 bg-white/5 px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
                />
              </label>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-7">
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center bg-white px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create project"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
