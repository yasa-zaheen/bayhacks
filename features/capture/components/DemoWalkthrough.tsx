"use client";

import { Badge } from "@/components/ui/badge";
import {
  LIVE_DEMO_SCRIPT,
  OPERATOR_MODE,
  RUBRIC_TALKING_POINTS,
} from "../utils/mockDemoGuide";
import { MockDemoStory } from "./MockDemoStory";

export function DemoWalkthrough() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-[#e5e5e5] bg-soft-cloud p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-mute">
            Bay Hacks · American Circular track
          </p>
          <Badge variant="outline">~4 min live</Badge>
          <Badge className="bg-[#0a7281] text-white">100 pt rubric</Badge>
        </div>
        <h2 className="mt-3 text-[28px] font-medium leading-tight">
          Full judge demo — blur, dark, then the right shot
        </h2>
        <p className="mt-3 max-w-3xl text-base text-mute">
          Two paths: run the{" "}
          <span className="font-medium text-ink">mock story</span> below (deterministic,
          no webcam) or follow the{" "}
          <span className="font-medium text-ink">live camera script</span> with intentional
          bad captures. Both use the same OpenCV QC engine.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {RUBRIC_TALKING_POINTS.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl bg-white p-3 ring-1 ring-[#e5e5e5]"
            >
              <p className="text-2xl font-medium">{row.points}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-mute">
                {row.label}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-mute">{row.line}</p>
            </div>
          ))}
        </div>
      </section>

      <MockDemoStory />

      <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-mute">
          What is Operator mode?
        </p>
        <h3 className="mt-2 text-xl font-medium">{OPERATOR_MODE.title}</h3>
        <p className="mt-2 text-sm text-mute">{OPERATOR_MODE.summary}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {OPERATOR_MODE.differences.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#0a7281]">→</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-soft-cloud px-4 py-3 text-sm">
          <span className="font-medium">When to use:</span> {OPERATOR_MODE.whenToUse}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ModeCard
            title="Demo voice"
            badge="Judges & recording"
            lines={[
              "Scripted MP3 coach (welcome → front → rear → serial tag).",
              "Auto-capture when the frame is stable.",
              "Issue-specific retake voice (blur, dark, glare…).",
            ]}
          />
          <ModeCard
            title="Operator"
            badge="Floor / silent"
            lines={[
              "Text + live telemetry HUD only.",
              "Auto-capture when stable AND API-ready (sharp + light gates).",
              "Same retake compare and passport — no narration.",
            ]}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#e5e5e5] bg-soft-cloud p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-mute">
            Live camera presenter script
          </p>
          <Badge variant="outline">Demo voice or Operator</Badge>
        </div>
        <ol className="mt-4 space-y-4">
          {LIVE_DEMO_SCRIPT.map((step) => (
            <li key={step.step} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {step.step}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{step.title}</p>
                  <Badge variant="outline">{step.mode}</Badge>
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-medium text-ink">Do:</span> {step.action}
                </p>
                <p className="mt-1 text-sm text-mute">
                  <span className="font-medium text-ink/80">Say:</span> {step.say}
                </p>
                <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-mute ring-1 ring-[#e5e5e5]">
                  Screen: {step.screen}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-[#1151ff]/20 bg-[#1151ff]/5 p-5">
        <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1151ff]">
          Upload tab backup (60 sec)
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li>
            <span className="font-medium">SET-008</span> — one blurry front (IMG-0004) plus
            good rear/label; shows retake on bad, passport on partial usable set.
          </li>
          <li>
            <span className="font-medium">SET-006</span> — clean three-view set; triggers
            celebration + full passport playbook.
          </li>
          <li>
            Watch the <span className="font-medium">analysis theater</span> while OpenCV runs;
            practice scoreboard shows label match vs American Circular key.
          </li>
        </ol>
      </section>
    </div>
  );
}

function ModeCard({
  title,
  badge,
  lines,
}: {
  title: string;
  badge: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl bg-soft-cloud p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{title}</p>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-mute">
        {lines.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
    </div>
  );
}
