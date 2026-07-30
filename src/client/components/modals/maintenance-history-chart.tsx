import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MaintenanceHistoryPoint } from "../../api";
import { formatBytes } from "../../lib/format";

type MaintenanceMetric = "disk" | "docker" | "builds";

function chartValue(point: MaintenanceHistoryPoint, metric: MaintenanceMetric) {
  if (metric === "disk") return point.diskUsedPercent;
  if (metric === "docker") return point.dockerReclaimableBytes;
  return point.buildArtifactsBytes;
}

function metricValue(value: number, metric: MaintenanceMetric) {
  return metric === "disk" ? `${value.toFixed(1)}%` : formatBytes(value);
}

function metricDelta(value: number, metric: MaintenanceMetric) {
  if (value === 0) return "No change";
  const prefix = value > 0 ? "+" : "−";
  const amount = metric === "disk"
    ? `${Math.abs(value).toFixed(1)} pts`
    : formatBytes(Math.abs(value));
  return `${prefix}${amount}`;
}

function timeLabel(value: number, spansMultipleDays: boolean) {
  const date = new Date(value);
  return spansMultipleDays
    ? date.toLocaleDateString([], { month: "short", day: "numeric" })
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function tooltipLabel(value: number) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function MaintenanceHistoryChart({
  history,
  metric,
  label
}: {
  history: MaintenanceHistoryPoint[];
  metric: MaintenanceMetric;
  label: string;
}) {
  const data = history.slice(-48).map((point) => ({
    checkedAt: new Date(point.checkedAt).getTime(),
    value: chartValue(point, metric)
  }));
  const values = data
    .map((point) => point.value)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const latest = values.at(-1) ?? null;
  const previous = values.at(-2) ?? latest;
  const minimum = values.length > 0 ? Math.min(...values) : null;
  const maximum = values.length > 0 ? Math.max(...values) : null;
  const delta = latest !== null && previous !== null ? latest - previous : 0;
  const spansMultipleDays = data.length > 1
    && data[data.length - 1].checkedAt - data[0].checkedAt >= 24 * 60 * 60 * 1000;
  const lineColor = metric === "disk" && latest !== null
    ? latest >= 90
      ? "#fb7185"
      : latest >= 80
        ? "#fcd34d"
        : "#ffffff"
    : "#ffffff";

  return (
    <section className="min-w-0 border border-white/10 bg-black">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
          <div className="mt-1.5 text-lg text-zinc-100">
            {latest === null ? "No data" : metricValue(latest, metric)}
          </div>
        </div>
        {latest !== null && values.length > 1 ? (
          <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${delta > 0 ? "text-amber-300" : delta < 0 ? "text-emerald-300" : "text-zinc-600"}`}>
            {metricDelta(delta, metric)}
          </span>
        ) : null}
      </header>

      <div className="h-48 px-2 pb-1 pt-3">
        {values.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-zinc-600">No samples yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="checkedAt"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) => timeLabel(Number(value), spansMultipleDays)}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fill: "#52525b", fontSize: 9, fontFamily: "ui-monospace, monospace" }}
              />
              <YAxis
                domain={metric === "disk" ? [0, 100] : [0, "auto"]}
                tickFormatter={(value) => metric === "disk" ? `${value}%` : formatBytes(Number(value))}
                axisLine={false}
                tickLine={false}
                width={54}
                tick={{ fill: "#52525b", fontSize: 9, fontFamily: "ui-monospace, monospace" }}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
                labelFormatter={(value) => tooltipLabel(Number(value))}
                formatter={(value) => [metricValue(Number(value), metric), label]}
                contentStyle={{
                  background: "#000000",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 0,
                  color: "#d4d4d8",
                  fontSize: 11
                }}
                labelStyle={{ color: "#71717a", fontFamily: "ui-monospace, monospace", fontSize: 9 }}
                itemStyle={{ color: "#f4f4f5" }}
              />
              {metric === "disk" ? (
                <>
                  <ReferenceLine y={80} stroke="rgba(252,211,77,0.45)" strokeDasharray="4 4" />
                  <ReferenceLine y={90} stroke="rgba(251,113,133,0.5)" strokeDasharray="4 4" />
                </>
              ) : null}
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: lineColor, stroke: "#000000", strokeWidth: 1 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <footer className="grid grid-cols-3 border-t border-white/10">
        <ChartStat label="Low" value={minimum === null ? "—" : metricValue(minimum, metric)} />
        <ChartStat label="High" value={maximum === null ? "—" : metricValue(maximum, metric)} />
        <ChartStat label="Samples" value={String(values.length)} />
      </footer>
    </section>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 px-3 py-2.5 last:border-r-0">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-zinc-700">{label}</div>
      <div className="mt-1 truncate font-mono text-[10px] text-zinc-400">{value}</div>
    </div>
  );
}
