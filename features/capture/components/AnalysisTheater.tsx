"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

export type AnalysisStage = {
  id: string;
  label: string;
  detail: string;
};

export const UPLOAD_ANALYSIS_STAGES: AnalysisStage[] = [
  { id: "ingest", label: "Ingest matrix", detail: "Buffering RAW capture tensors" },
  { id: "decode", label: "Decode pipeline", detail: "Normalizing color space · EXIF strip" },
  { id: "laplacian", label: "Sharpness field", detail: "Laplacian variance on device ROI" },
  { id: "exposure", label: "Exposure spectrum", detail: "Luma histogram + glare mask" },
  { id: "framing", label: "Framing hull", detail: "Contour fit vs intended view" },
  { id: "label", label: "Asset tag scan", detail: "Serial / model plate legibility" },
  { id: "fraud", label: "Integrity scan", detail: "View mismatch + tamper heuristics" },
  { id: "passport", label: "Passport synth", detail: "Route · grade · CO₂ model" },
];

export const UPLOAD_ANALYSIS_STAGE_MS = 700;

type Props = {
  active: boolean;
  onComplete?: () => void;
};

export function AnalysisTheater({ active, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [pulse, setPulse] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      finishedRef.current = false;
      return;
    }

    finishedRef.current = false;
    setIndex(0);
    let step = 0;

    const stageTimer = window.setInterval(() => {
      step += 1;
      if (step >= UPLOAD_ANALYSIS_STAGES.length - 1) {
        setIndex(UPLOAD_ANALYSIS_STAGES.length - 1);
        window.clearInterval(stageTimer);
        window.setTimeout(() => {
          if (finishedRef.current) return;
          finishedRef.current = true;
          onCompleteRef.current?.();
        }, UPLOAD_ANALYSIS_STAGE_MS);
        return;
      }
      setIndex(step);
    }, UPLOAD_ANALYSIS_STAGE_MS);

    const pulseTimer = window.setInterval(() => setPulse((p) => (p + 1) % 100), 40);
    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(pulseTimer);
    };
  }, [active]);

  if (!active) return null;

  const stage = UPLOAD_ANALYSIS_STAGES[index];
  const progress = ((index + 1) / UPLOAD_ANALYSIS_STAGES.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="analysis-theater relative max-h-[90vh] w-full max-w-4xl overflow-y-auto overflow-hidden rounded-3xl border border-[#1151ff]/30 bg-[#050816] p-6 text-white shadow-[0_0_60px_rgba(17,81,255,0.18)]">
      <div className="analysis-grid absolute inset-0 opacity-30" />
      <div className="analysis-scanline absolute inset-0" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#7ef0df]">
              ApertureGrade neural QC
            </p>
            <h3 className="mt-1 text-2xl font-medium">Analyzing capture set</h3>
          </div>
          <Badge className="rounded-full bg-[#1151ff]/20 text-[#beaffd]">
            LIVE INFERENCE
          </Badge>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#0a7281] via-[#1151ff] to-[#ed1aa0] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 font-mono text-xs">
            <p className="text-[#ffb0dd]">&gt; stage/{stage.id}</p>
            <p className="mt-2 text-lg text-white">{stage.label}</p>
            <p className="mt-1 text-white/60">{stage.detail}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-white/45">
              <p>hash: {hashPulse(pulse)}</p>
              <p>nodes: {12 + (index % 5)}</p>
              <p>latency: {(120 + index * 17).toFixed(0)}ms</p>
              <p>confidence: {(0.62 + index * 0.04).toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {UPLOAD_ANALYSIS_STAGES.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                  i === index
                    ? "bg-[#1151ff]/20 text-white"
                    : i < index
                      ? "bg-[#007d48]/15 text-[#9ef0c8]"
                      : "bg-white/5 text-white/40"
                }`}
              >
                <span>{item.label}</span>
                <span>{i < index ? "OK" : i === index ? "…" : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function hashPulse(n: number) {
  return `0x${(0x9e3779b9 ^ n * 2654435761).toString(16).slice(0, 8)}`;
}
