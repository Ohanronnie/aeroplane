import { LeftToRightListStarIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { DeploymentLog, RuntimeLog } from "../../api";
import { AppIcon } from "../../components/ui/primitives";

export function DeploymentLogsPanel({
  logs,
  emptyLabel,
  title,
  meta,
  actions,
  embedded = false
}: {
  logs: DeploymentLog[];
  emptyLabel: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  embedded?: boolean;
}) {
  const ref = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className={`flex h-full min-h-0 min-w-0 flex-col bg-black text-zinc-100 ${embedded ? "" : "border border-white/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
            <AppIcon icon={LeftToRightListStarIcon} size={14} />
            {title}
          </div>
          {meta ? <div className="mt-1 text-[10px] text-zinc-600">{meta}</div> : null}
        </div>
        {actions ? <div className="shrink-0 whitespace-nowrap">{actions}</div> : null}
      </div>
      <pre ref={ref} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all p-4 font-mono text-xs leading-6 text-zinc-300 sm:p-5">
        {logs.length > 0 ? logs.map((log) => `[${new Date(log.createdAt).toLocaleTimeString()}] ${log.line}`).join("\n") : emptyLabel}
      </pre>
    </div>
  );
}

export function RuntimeLogsPanel({ logs, emptyLabel, title }: { logs: RuntimeLog[]; emptyLabel: string; title: string }) {
  const ref = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border border-white/10 bg-black text-zinc-100">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 sm:px-5">
        <AppIcon icon={LeftToRightListStarIcon} size={14} />
        {title}
      </div>
      <pre ref={ref} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all p-4 font-mono text-xs leading-6 text-zinc-300 sm:p-5">
        {logs.length > 0 ? logs.map((log) => `[${new Date(log.createdAt).toLocaleTimeString()}] ${log.line}`).join("\n") : emptyLabel}
      </pre>
    </div>
  );
}
