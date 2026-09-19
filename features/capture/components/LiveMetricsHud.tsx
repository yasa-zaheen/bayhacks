"use client";

import type { LiveCoachSnapshot } from "../api/qcClient";

type Props = {
  snapshot: LiveCoachSnapshot;
  alignment: number;
  stableProgress: number;
  motion: number;
  online: boolean;
  mode: "demo" | "operator";
  usableCount: number;
  retakeCount: number;
};

export function LiveMetricsHud({
  snapshot,
  alignment,
  stableProgress,
  motion,
  online,
  mode,
  usableCount,
  retakeCount,
}: Props) {
  const sharp = Math.round(snapshot.metrics.sharpness * 100);
  const exposure = Math.round(snapshot.metrics.exposure * 100);
  const routeValue = usableCount >= 3 ? 85 : usableCount >= 2 ? 52 : usableCount >= 1 ? 28 : 0;
  const routeLabel =
    usableCount >= 3 ? "Refurb route unlocked" : usableCount >= 1 ? "Partial set" : "Scanning…";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/55 to-transparent px-4 pt-16 pb-4 text-white">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
          <p className="text-[10px] font-semibold tracking-[0.24em] uppercase text-white/60">
            Live telemetry · {mode}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <Metric label="Sharp" value={`${sharp}%`} tone={sharp > 65 ? "good" : "warn"} />
            <Metric label="Align" value={`${alignment}%`} tone={alignment > 70 ? "good" : "warn"} />
            <Metric label="Stable" value={`${Math.round(stableProgress * 100)}%`} tone={stableProgress > 0.85 ? "good" : "neutral"} />
            <Metric label="Light" value={`${exposure}%`} tone="neutral" />
            <Metric label="Motion" value={motion.toFixed(2)} tone={motion < 0.05 ? "good" : "warn"} />
            <Metric label="API" value={online ? "ONLINE" : "OFF"} tone={online ? "good" : "warn"} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#0a7281]/40 bg-[#0a7281]/15 p-3 backdrop-blur-md">
          <p className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#7ef0df]">
            Circular route preview
          </p>
          <p className="mt-1 text-lg font-medium">${routeValue} est.</p>
          <p className="text-xs text-white/70">{routeLabel}</p>
          <p className="mt-2 text-[11px] text-white/55">
            {usableCount}/3 views locked · {retakeCount} retake{retakeCount === 1 ? "" : "s"}
          </p>
          <p className="mt-1 truncate text-[11px] text-[#ffb0dd]">
            {snapshot.guidance}
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  const color =
    tone === "good" ? "#1eaa52" : tone === "warn" ? "#ffb347" : "rgba(255,255,255,0.82)";
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-white/45">{label}</p>
      <p style={{ color }}>{value}</p>
    </div>
  );
}
