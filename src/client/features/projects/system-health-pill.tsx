import type { ToolCheck } from "../../api";

export function SystemHealthPill({ tools }: { tools: ToolCheck[] }) {
  const okCount = tools.filter((tool) => tool.ok).length;
  const totalCount = tools.length;
  const allOk = totalCount > 0 && okCount === totalCount;
  const label = totalCount === 0 ? "Checking" : allOk ? "System ready" : `${okCount}/${totalCount} ready`;
  const detail = tools.length > 0 ? tools.map((tool) => `${tool.name}: ${tool.ok ? "ok" : tool.detail}`).join("\n") : "Checking host tools";

  return (
    <div
      className="flex h-10 w-full items-center gap-2 border border-white/10 bg-white/5 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
      title={detail}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          allOk ? "bg-white" : "bg-zinc-600"
        }`}
      />
      <span>{label}</span>
    </div>
  );
}
