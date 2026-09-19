"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const SAMPLE_MS = 80;
const HOLD_MS = 1000;
/** Mobile auto-exposure noise is much higher than laptop webcams. */
const STABLE_THRESHOLD = 0.14;
const PROGRESS_SMOOTH = 0.22;

export function useStabilityGate(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  sampleMs = SAMPLE_MS,
  resetKey = 0
) {
  const [motion, setMotion] = useState(1);
  const [progress, setProgress] = useState(0);
  const prevRef = useRef<ImageData | null>(null);
  const lastSampleRef = useRef(0);
  const stableAccumRef = useRef(0);
  const smoothedMotionRef = useRef(1);
  const displayProgressRef = useRef(0);
  const primedRef = useRef(false);

  useEffect(() => {
    setMotion(1);
    setProgress(0);
    prevRef.current = null;
    stableAccumRef.current = 0;
    smoothedMotionRef.current = 1;
    displayProgressRef.current = 0;
    primedRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) {
      setMotion(1);
      setProgress(0);
      prevRef.current = null;
      stableAccumRef.current = 0;
      smoothedMotionRef.current = 1;
      displayProgressRef.current = 0;
      primedRef.current = false;
      return;
    }

    let raf = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function loop(now: number) {
      const video = videoRef.current;
      if (video && ctx && video.readyState >= 2 && video.videoWidth > 0) {
        if (now - lastSampleRef.current >= sampleMs) {
          lastSampleRef.current = now;
          const w = 72;
          const h = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * w));
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);

          let rawDiff = 0;
          if (prevRef.current) {
            const prev = prevRef.current.data;
            const cur = frame.data;
            let sum = 0;
            let count = 0;
            for (let i = 0; i < cur.length; i += 12) {
              sum +=
                Math.abs(cur[i] - prev[i]) +
                Math.abs(cur[i + 1] - prev[i + 1]) +
                Math.abs(cur[i + 2] - prev[i + 2]);
              count += 1;
            }
            rawDiff = sum / Math.max(count, 1) / 255;
          }

          prevRef.current = frame;

          if (!primedRef.current) {
            primedRef.current = true;
          } else {
            smoothedMotionRef.current =
              smoothedMotionRef.current * 0.72 + rawDiff * 0.28;
            const motionValue = smoothedMotionRef.current;
            setMotion(motionValue);

            if (motionValue < STABLE_THRESHOLD) {
              stableAccumRef.current = Math.min(
                HOLD_MS,
                stableAccumRef.current + sampleMs
              );
            } else {
              stableAccumRef.current = Math.max(
                0,
                stableAccumRef.current - sampleMs * 0.55
              );
            }

            const target = stableAccumRef.current / HOLD_MS;
            displayProgressRef.current +=
              (target - displayProgressRef.current) * PROGRESS_SMOOTH;
            setProgress(displayProgressRef.current);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      prevRef.current = null;
      stableAccumRef.current = 0;
      smoothedMotionRef.current = 1;
      displayProgressRef.current = 0;
      primedRef.current = false;
    };
  }, [enabled, sampleMs, videoRef]);

  const isStable = progress >= 0.96 && motion < STABLE_THRESHOLD * 1.35;

  return {
    motion,
    stableMs: stableAccumRef.current,
    progress: Math.min(1, progress),
    isStable,
  };
}

export function pulseHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(28);
  }
}
