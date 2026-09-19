"use client";

import { fallbackBox } from "../hooks/useMediaPipeGuide";
import type { GuideBox, ViewName } from "../types";

type Props = {
  width: number;
  height: number;
  view: ViewName;
  ready: boolean;
  detected: GuideBox | null;
  detectedLabel: string | null;
};

export function ArGuideOverlay({
  width,
  height,
  view,
  ready,
  detected,
  detectedLabel,
}: Props) {
  const guide = detected ?? fallbackBox(view);
  const bx = guide.x * width;
  const by = guide.y * height;
  const bw = guide.w * width;
  const bh = guide.h * height;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const corner = Math.min(bw, bh) * 0.12;
  const accent = ready ? "#007d48" : "#e85d04";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width || 1} ${height || 1}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="poseidon-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={accent} stopOpacity="0.4" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1={cx}
        y1={by + 8}
        x2={cx}
        y2={by + bh - 8}
        stroke={accent}
        strokeWidth={0.75}
        strokeOpacity={0.28}
        strokeDasharray="6 8"
      />
      <line
        x1={bx + 8}
        y1={cy}
        x2={bx + bw - 8}
        y2={cy}
        stroke={accent}
        strokeWidth={0.75}
        strokeOpacity={0.28}
        strokeDasharray="6 8"
      />

      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="none"
        stroke={accent}
        strokeWidth={1}
        strokeOpacity={0.45}
      />

      {!ready && (
        <g>
          <rect
            x={bx}
            y={by}
            width={bw}
            height={24}
            fill="url(#poseidon-scan)"
            style={{
              animation: "poseidon-scan 2s linear infinite",
              transformOrigin: `${bx}px ${by}px`,
            }}
          />
        </g>
      )}

      <line x1={bx} y1={by} x2={bx + corner} y2={by} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by} x2={bx} y2={by + corner} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by} x2={bx + bw - corner} y2={by} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by} x2={bx + bw} y2={by + corner} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by + bh} x2={bx + corner} y2={by + bh} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by + bh} x2={bx} y2={by + bh - corner} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by + bh} x2={bx + bw - corner} y2={by + bh} stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by + bh} x2={bx + bw} y2={by + bh - corner} stroke={accent} strokeWidth={3} strokeLinecap="round" />

      <rect
        x={bx}
        y={by + bh + 10}
        width={108}
        height={22}
        rx={11}
        fill={ready ? "rgba(0,125,72,0.18)" : "rgba(232,93,4,0.16)"}
        stroke={accent}
      />
      <text
        x={bx + 16}
        y={by + bh + 25}
        fill={accent}
        fontSize={10}
        fontWeight={800}
        letterSpacing={1.4}
      >
        {ready ? "LOCKED" : detected ? "TRACKING" : "ALIGN"}
      </text>

      {detectedLabel ? (
        <text x={bx} y={by - 10} fill={accent} fontSize={11} fontWeight={700}>
          {detectedLabel.toUpperCase()}
        </text>
      ) : null}
    </svg>
  );
}
