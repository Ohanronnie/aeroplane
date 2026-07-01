import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useId } from "react";
import { AppIcon, shellButton, surfaceClass } from "../ui/primitives";

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
  zIndexClassName = "z-[70]",
  onClose,
  onConfirm
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClassName} grid place-items-center bg-black/55 p-4 backdrop-blur-sm`}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className={surfaceClass("w-full max-w-md p-5")}>
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 flex-none place-items-center border border-rose-500/35 bg-rose-500/10 text-rose-200">
            <AppIcon icon={icon} size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</div>
            <h2 id={titleId} className="mt-1 font-hero text-xl tracking-tight text-zinc-100">
              {title}
            </h2>
            {subject ? <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{subject}</p> : null}
          </div>
        </div>

        <p id={descriptionId} className="mt-5 border border-rose-500/25 bg-rose-950/20 px-4 py-3 text-sm leading-relaxed text-rose-100">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button type="button" className={shellButton("ghost")} onClick={onClose} disabled={busy}>
            <AppIcon icon={Cancel01Icon} size={14} />
            Cancel
          </button>
          <button type="button" className={shellButton("danger")} onClick={() => void onConfirm()} disabled={busy}>
            <AppIcon icon={confirmIcon} size={16} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
