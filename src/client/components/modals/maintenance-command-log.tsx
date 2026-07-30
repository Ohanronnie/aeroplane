import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { MaintenanceCommandResult } from "../../api";
import { AppIcon } from "../ui/primitives";

export function MaintenanceCommandLog({ commands }: { commands: MaintenanceCommandResult[] }) {
  if (commands.length === 0) return null;

  const complete = commands.every((command) => command.ok);

  return (
    <section className="border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
        <h3 className="text-sm text-zinc-100">Cleanup activity</h3>
        <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${complete ? "text-emerald-300" : "text-rose-300"}`}>
          <span className={`h-1.5 w-1.5 ${complete ? "bg-emerald-400" : "bg-rose-400"}`} />
          {complete ? "Complete" : "Check output"}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto p-4">
        <div className="space-y-4">
          {commands.map((command) => (
            <div key={command.label}>
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                <AppIcon icon={command.ok ? CheckmarkCircle02Icon : Alert02Icon} size={14} className={command.ok ? "text-emerald-300" : "text-rose-300"} />
                {command.label}
              </div>
              <pre className="mt-2 overflow-x-auto border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-400">
                {command.output || "Done."}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
