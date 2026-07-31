import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useId } from "react";
import { AppIcon } from "../ui/primitives";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  subject?: string;
  eyebrow?: string;
  busy?: boolean;
  icon?: unknown;
  confirmIcon?: unknown;
  tone?: "danger" | "warning";
  zIndexClassName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  subject,
  eyebrow = "Confirm action",
  busy = false,
  icon = Delete02Icon,
  confirmIcon = Delete02Icon,
  tone = "danger",
  zIndexClassName = "z-[70]",
  onClose,
  onConfirm
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const iconToneClass = tone === "warning" ? "text-amber-300" : "text-rose-300";
  const descriptionToneClass = tone === "warning"
    ? "border-amber-400 bg-amber-400/10 text-amber-100"
    : "border-rose-400 bg-rose-400/10 text-rose-100";
  const confirmToneClass = tone === "warning"
    ? "border-amber-400/50 text-amber-200 hover:bg-amber-400/10"
    : "border-rose-400/50 text-rose-200 hover:bg-rose-400/10";

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClassName} overflow-y-auto bg-black/75 p-4`}>
      <div className="mx-auto flex min-h-full items-center justify-center">
        <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md border border-white/15 bg-black">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <AppIcon icon={icon} size={16} className={`shrink-0 ${iconToneClass}`} />
              <div className="min-w-0">
                <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-600">{eyebrow}</div>
                <h2 id={titleId} className="truncate text-lg tracking-[-0.03em] text-zinc-100">
              {title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-zinc-400 transition hover:border-white/35 hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              title="Close"
            >
              <AppIcon icon={Cancel01Icon} size={16} />
            </button>
          </header>

          <div className="p-4">
            {subject ? <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{subject}</p> : null}
            <p id={descriptionId} className={`mt-4 border-l-2 px-4 py-3 text-sm leading-relaxed ${descriptionToneClass}`}>
              {description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center border border-white/15 px-3.5 text-sm text-zinc-300 transition hover:border-white/35 hover:bg-white/[0.05] disabled:opacity-50"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex h-9 items-center justify-center gap-2 border px-3.5 text-sm transition disabled:opacity-50 ${confirmToneClass}`}
                onClick={() => void onConfirm()}
                disabled={busy}
              >
                <AppIcon icon={confirmIcon} size={14} />
                {confirmLabel}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
