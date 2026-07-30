import { CopyCheckIcon, CopyIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { AppIcon } from "../../components/ui/primitives";

function copyTextFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

export function DeploymentFailureCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(command);
    } else {
      copyTextFallback(command);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="flex items-start gap-2">
      <pre className="min-w-0 flex-1 overflow-x-auto border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-xs text-zinc-300">
        {command}
      </pre>
      <button
        type="button"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border transition ${
          copied
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-white/15 text-zinc-500 hover:border-white/35 hover:bg-white/[0.05] hover:text-white"
        }`}
        onClick={() => void copyCommand()}
        title={copied ? "Copied" : "Copy command"}
        aria-label={copied ? "Copied command" : "Copy command"}
      >
        <AppIcon icon={copied ? CopyCheckIcon : CopyIcon} size={15} />
      </button>
    </div>
  );
}
