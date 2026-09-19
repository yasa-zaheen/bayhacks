"use client";

import type { GuideBox } from "../types";

type Props = {
  width: number;
  height: number;
  detected: GuideBox | null;
  ready: boolean;
  retake: boolean;
};

export function ArGuideOverlay({
  width,
  height,
  detected,
  ready,
  retake,
}: Props) {
  if (!detected) return null;

  const bx = detected.x * width;
  const by = detected.y * height;
  const bw = detected.w * width;
  const bh = detected.h * height;
  const corner = Math.min(bw, bh) * 0.14;
  const stroke = retake ? "#d30005" : ready ? "#007d48" : "#ffffff";

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width || 1} ${height || 1}`}
      preserveAspectRatio="none"
    >
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bh}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeOpacity={0.35}
        rx={4}
      />

      <line x1={bx} y1={by} x2={bx + corner} y2={by} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by} x2={bx} y2={by + corner} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by} x2={bx + bw - corner} y2={by} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by} x2={bx + bw} y2={by + corner} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by + bh} x2={bx + corner} y2={by + bh} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx} y1={by + bh} x2={bx} y2={by + bh - corner} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by + bh} x2={bx + bw - corner} y2={by + bh} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1={bx + bw} y1={by + bh} x2={bx + bw} y2={by + bh - corner} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
