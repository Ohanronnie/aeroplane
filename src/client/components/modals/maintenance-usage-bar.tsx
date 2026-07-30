export function MaintenanceUsageBar({
  label,
  value,
  detail,
  percent,
  percentLabel,
  tone = "teal"
}: {
  label: string;
  value: string;
  detail?: string;
  percent: number;
  percentLabel?: string;
  tone?: "teal" | "amber" | "rose" | "zinc";
}) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const color =
    tone === "rose"
      ? "bg-rose-400"
      : tone === "amber"
        ? "bg-amber-300"
        : tone === "zinc"
          ? "bg-zinc-400"
          : "bg-white";

  return (
    <div className="border border-white/10 bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
          <div className="mt-2 text-lg text-zinc-100">{value}</div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">{percentLabel ?? `${Math.round(clampedPercent)}%`}</div>
      </div>
      <div className="mt-4 h-1 bg-white/10">
        <div className={`h-full ${color}`} style={{ width: `${clampedPercent}%` }} />
      </div>
      {detail ? <p className="mt-3 text-xs leading-relaxed text-zinc-600">{detail}</p> : null}
    </div>
  );
}
