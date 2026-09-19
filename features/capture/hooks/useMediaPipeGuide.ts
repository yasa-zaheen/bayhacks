"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";
import type { GuideBox, ViewName } from "../types";
import { smoothGuideBox, stabilizeLabel, tightenGuideBox } from "../utils/smoothGuide";
import {
  installWasmConsoleNoiseFilter,
  uninstallWasmConsoleNoiseFilter,
} from "../utils/suppressWasmConsoleNoise";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

const DEVICE_LABELS = new Set([
  "tv",
  "laptop",
  "keyboard",
  "cell phone",
  "mouse",
  "remote",
  "book",
  "monitor",
  "microwave",
  "toaster",
  "oven",
  "clock",
  "suitcase",
]);

/** Never track the operator — only the prop / device. */
const BLOCKED_LABELS = new Set([
  "person",
  "face",
  "hair",
  "head",
  "hand",
  "human face",
  "human body",
  "selfie",
  "man",
  "woman",
  "boy",
  "girl",
]);

/** Static guide when detector has not locked on yet — intentionally narrow. */
export function fallbackBox(view: ViewName): GuideBox {
  if (view === "label") return { x: 0.32, y: 0.22, w: 0.36, h: 0.5 };
  return { x: 0.2, y: 0.26, w: 0.6, h: 0.4 };
}

export function useMediaPipeGuide(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const [box, setBox] = useState<GuideBox | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBox(null);
      setLabel(null);
      return;
    }

    let cancelled = false;
    let detector: ObjectDetector | null = null;
    let raf = 0;
    let lastFrameAt = 0;
    let videoTs = 0;
    let smoothBoxRef: GuideBox | null = null;
    let labelRef: string | null = null;
    let labelStreakRef = 0;
    let missFrames = 0;

    installWasmConsoleNoiseFilter();

    async function load() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          scoreThreshold: 0.32,
          maxResults: 10,
        });
        if (!cancelled) loop();
      } catch {
        // Overlay falls back to the static guide frame.
      }
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      const now = performance.now();
      if (
        detector &&
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        now - lastFrameAt > 90
      ) {
        try {
          videoTs += 33;
          const result = detector.detectForVideo(video, videoTs);
          const pick = pickDevice(
            result.detections,
            video.videoWidth,
            video.videoHeight
          );
          if (pick) {
            missFrames = 0;
            const tight = tightenGuideBox(pick.box, 0.08);
            smoothBoxRef = smoothGuideBox(smoothBoxRef, tight, 0.18);
            const stable = stabilizeLabel(
              labelRef,
              pick.label,
              labelStreakRef,
              6
            );
            labelRef = stable.label;
            labelStreakRef = stable.sameCount;
            setBox(smoothBoxRef);
            setLabel(labelRef);
          } else if (smoothBoxRef && missFrames < 8) {
            missFrames += 1;
            setBox(smoothBoxRef);
          } else if (!smoothBoxRef) {
            setBox(null);
            setLabel(null);
          }
        } catch {
          // Drop the frame if MediaPipe is still warming up.
        }
        lastFrameAt = now;
      }
      raf = requestAnimationFrame(loop);
    }

    load();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      detector?.close();
      uninstallWasmConsoleNoiseFilter();
    };
  }, [enabled, videoRef]);

  return {
    box: enabled ? box : null,
    label: enabled ? label : null,
  };
}

type Candidate = {
  box: GuideBox;
  label: string;
  rawLabel: string;
  score: number;
  areaNorm: number;
};

function pickDevice(
  detections: {
    categories: { categoryName: string; score: number }[];
    boundingBox?: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    };
  }[],
  vw: number,
  vh: number
) {
  const candidates: Candidate[] = [];
  const personBoxes: GuideBox[] = [];

  for (const detection of detections) {
    const bbox = detection.boundingBox;
    const category = detection.categories[0];
    if (!bbox || !category) continue;

    const raw = category.categoryName.toLowerCase();
    const box: GuideBox = {
      x: bbox.originX / vw,
      y: bbox.originY / vh,
      w: bbox.width / vw,
      h: bbox.height / vh,
    };
    const areaNorm = box.w * box.h;

    if (isBlockedLabel(raw) || isLikelyPersonShape(box, areaNorm, raw)) {
      if (raw === "person" || areaNorm > 0.2) {
        personBoxes.push(box);
      }
      continue;
    }

    const ranked = scoreCandidate(box, areaNorm, raw, category.score);
    if (ranked < 0) continue;

    candidates.push({
      box,
      rawLabel: raw,
      label: formatDeviceLabel(raw),
      score: ranked,
      areaNorm,
    });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);

  for (const candidate of candidates) {
    if (isMostlyInsidePerson(candidate.box, personBoxes, candidate.rawLabel)) {
      continue;
    }
    return candidate;
  }

  return candidates[0] ?? null;
}

function isBlockedLabel(raw: string) {
  if (BLOCKED_LABELS.has(raw)) return true;
  return raw.includes("person") || raw.includes("face") || raw.includes("hand");
}

function isLikelyPersonShape(box: GuideBox, areaNorm: number, raw: string) {
  if (raw === "person") return true;
  const aspect = box.w / Math.max(box.h, 0.001);
  // Large vertical region — typical laptop selfie of the operator
  if (areaNorm > 0.22 && box.h > 0.45 && aspect < 0.85) return true;
  // Full-frame human silhouette
  if (areaNorm > 0.42 && box.h > 0.55) return true;
  return false;
}

function scoreCandidate(
  box: GuideBox,
  areaNorm: number,
  raw: string,
  confidence: number
) {
  if (areaNorm < 0.04 || areaNorm > 0.72) return -1;

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const centerDist = Math.hypot(cx - 0.5, cy - 0.55);
  const centerScore = 1 - Math.min(1, centerDist * 1.4);

  let labelScore = 0.45;
  if (DEVICE_LABELS.has(raw)) labelScore = 1;
  else if (areaNorm >= 0.06 && areaNorm <= 0.42 && centerScore > 0.45) {
    labelScore = 0.78;
  }

  const aspect = box.w / Math.max(box.h, 0.001);
  const aspectScore = aspect > 0.2 && aspect < 5 ? 1 : 0.4;

  return (
    areaNorm * 0.28 +
    centerScore * 0.3 +
    confidence * 0.18 +
    labelScore * 0.16 +
    aspectScore * 0.08
  );
}

function boxIoU(a: GuideBox, b: GuideBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return inter / Math.max(union, 0.0001);
}

function isMostlyInsidePerson(
  box: GuideBox,
  personBoxes: GuideBox[],
  rawLabel: string
) {
  if (!personBoxes.length) return false;
  if (DEVICE_LABELS.has(rawLabel)) return false;

  for (const person of personBoxes) {
    const iou = boxIoU(box, person);
    if (iou > 0.55) return true;
    if (iou > 0.2 && box.w * box.h > person.w * person.h * 0.85) return true;
  }
  return false;
}

function formatDeviceLabel(raw: string) {
  if (raw === "tv" || raw === "monitor") return "display";
  if (raw === "cell phone") return "device";
  if (DEVICE_LABELS.has(raw)) return raw.replace(/_/g, " ");
  return "device";
}
