import { ConfirmationDialog } from "./confirmation-dialog";

export function RedisDeleteKeyModal({
  open,
  keyName,
  busy,
  onClose,
  onConfirm
}: {
  open: boolean;
  keyName: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <ConfirmationDialog
      open={open}
      title="Delete key?"
      subject={keyName}
      description="This permanently removes the key and its stored value."
      confirmLabel="Delete key"
      eyebrow="Redis data"
      busy={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
