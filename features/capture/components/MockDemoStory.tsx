"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzePracticeImage } from "../api/analyze";
import { practiceImageUrl } from "../api/analyze";
import type { PhotoResult } from "../types";
import { MOCK_PASSPORT_SET, MOCK_QC_STORY, type MockStoryBeat } from "../utils/mockDemoGuide";

const ISSUE_LABEL: Record<string, string> = {
  blur: "Too blurry",
  underexposed: "Too dark",
  glare_or_overexposed: "Too much glare",
  framing: "Bad framing",
  label_obstructed: "Label obstructed",
};

type BeatResult = {
  beat: MockStoryBeat;
  photo: PhotoResult;
  imageUrl: string;
};

export function MockDemoStory() {
  const [activeStep, setActiveStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<BeatResult[]>([]);

  const beat = MOCK_QC_STORY[activeStep];

  async function runBeat(index = activeStep) {
    const target = MOCK_QC_STORY[index];
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const photo = await analyzePracticeImage(target.imageId, target.view);
      const imageUrl = practiceImageUrl(target.imageId);
      setResults((prev) => {
        const next = prev.filter((row) => row.beat.id !== target.id);
        return [...next, { beat: target, photo, imageUrl }].sort(
          (a, b) => a.beat.step - b.beat.step
        );
      });
      setActiveStep(index);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function runFullStory() {
    setResults([]);
    for (let i = 0; i < MOCK_QC_STORY.length; i += 1) {
      setActiveStep(i);
      // eslint-disable-next-line no-await-in-loop
      await runBeat(i);
    }
  }

  const current = results.find((row) => row.beat.id === beat?.id);

  return (
    <section className="rounded-3xl border border-[#1151ff]/25 bg-linear-to-br from-[#eef4ff] to-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1151ff]">
            Mock QC story · no camera
          </p>
          <h3 className="mt-1 text-xl font-medium">
            Blur → too dark → good photo
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-mute">
            Runs real OpenCV on American Circular practice images. Use this when
            judges cannot see your webcam or you need a deterministic retake loop.
          </p>
        </div>
        <Badge variant="outline">~90 sec</Badge>
      </div>

      <ol className="mt-5 space-y-3">
        {MOCK_QC_STORY.map((row, index) => {
          const done = results.some((r) => r.beat.id === row.id);
          const active = index === activeStep;
          return (
            <li
              key={row.id}
              className={`rounded-2xl border p-4 transition-colors ${
                active
                  ? "border-[#1151ff]/40 bg-white"
                  : "border-[#e5e5e5] bg-white/70"
              }`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? "bg-[#007d48] text-white" : "bg-ink text-white"
                  }`}
                >
                  {row.step}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.title}</p>
                    <Badge variant="outline">{row.imageId}</Badge>
                    {done ? (
                      <Badge className="bg-[#007d48] text-white">Ran</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-mute">{row.say}</p>
                  <p className="mt-2 rounded-xl bg-soft-cloud px-3 py-2 font-mono text-[11px] text-ink/80">
                    {row.screen}
                  </p>
                  <p className="mt-2 text-xs text-[#1151ff]">{row.rubric}</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full"
                  variant={active ? "default" : "secondary"}
                  disabled={busy}
                  onClick={() => runBeat(index)}
                >
                  Run beat
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="rounded-full"
          onClick={() => runFullStory()}
          disabled={busy}
        >
          {busy ? "Analyzing…" : "Run full mock story"}
        </Button>
        <Button
          className="rounded-full"
          variant="secondary"
          disabled={busy || activeStep >= MOCK_QC_STORY.length - 1}
          onClick={() => setActiveStep((s) => Math.min(s + 1, MOCK_QC_STORY.length - 1))}
        >
          Next beat
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-sale">{error}</p> : null}

      {current ? (
        <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={current.beat.imageId}
            className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-[#e5e5e5]"
          />
          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e5e5e5]">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
              Live API result
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                className={
                  current.photo.status === "usable"
                    ? "bg-[#007d48] text-white"
                    : "bg-[#d30005] text-white"
                }
              >
                {current.photo.status}
              </Badge>
              {current.photo.issue_codes.length ? (
                current.photo.issue_codes.map((code) => (
                  <Badge key={code} variant="outline">
                    {ISSUE_LABEL[code] ?? code}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">no issues</Badge>
              )}
            </div>
            <p className="mt-3 text-sm">{current.photo.retake_guidance || current.photo.reason}</p>
            <p className="mt-2 text-xs text-mute">
              Expected: {current.beat.expectedStatus}
              {current.beat.expectedIssues.length
                ? ` · ${current.beat.expectedIssues.join(", ")}`
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      {results.length >= 2 ? (
        <div className="mt-5 rounded-2xl border border-[#e85d04]/20 bg-[#e85d04]/6 p-4">
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#e85d04]">
            Story so far
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {results.map(({ beat: row, photo, imageUrl }) => (
              <div key={row.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-[#e5e5e5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={row.imageId} className="aspect-[4/3] w-full object-cover" />
                <div className="p-2 text-xs">
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-mute">
                    {photo.status}
                    {photo.issue_codes[0]
                      ? ` · ${ISSUE_LABEL[photo.issue_codes[0]] ?? photo.issue_codes[0]}`
                      : " · accepted"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-mute">
        Payoff: Upload tab → run practice set{" "}
        <span className="font-medium text-ink">{MOCK_PASSPORT_SET.setId}</span>{" "}
        for passport + playbook. {MOCK_PASSPORT_SET.say}
      </p>
    </section>
  );
}
