"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";
import type { GuideBox, ViewName } from "../types";
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
]);

export function fallbackBox(view: ViewName): GuideBox {
  if (view === "label") return { x: 0.28, y: 0.18, w: 0.44, h: 0.58 };
  return { x: 0.12, y: 0.2, w: 0.76, h: 0.5 };
}

export function useMediaPipeGuide(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const [box, setBox] = useState<GuideBox | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let detector: ObjectDetector | null = null;
    let raf = 0;
    let lastFrameAt = 0;
    let videoTs = 0;

    installWasmConsoleNoiseFilter();

    async function load() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          scoreThreshold: 0.35,
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
            setBox(pick.box);
            setLabel(pick.label);
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
  let best: {
    area: number;
    box: GuideBox;
    label: string;
    preferred: boolean;
  } | null = null;

  for (const detection of detections) {
    const bbox = detection.boundingBox;
    const category = detection.categories[0];
    if (!bbox || !category) continue;
    const preferred = DEVICE_LABELS.has(category.categoryName.toLowerCase());
    const area = bbox.width * bbox.height;
    if (!best || (preferred && !best.preferred) || area > best.area) {
      best = {
        area,
        preferred,
        label: category.categoryName,
        box: {
          x: bbox.originX / vw,
          y: bbox.originY / vh,
          w: bbox.width / vw,
          h: bbox.height / vh,
        },
      };
    }
  }

  return best;
}
