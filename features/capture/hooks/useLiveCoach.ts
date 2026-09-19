"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { analyzeLiveBlob, dataUrlToBlob, type LiveCoachSnapshot } from "../api/qcClient";
import type { ViewName } from "../types";

const EMPTY: LiveCoachSnapshot = {
  ready: false,
  status: "needs_review",
  issue_codes: [],
  guidance: "Starting live coach…",
  metrics: {
    sharpness: 0,
    exposure: 0,
    glare: 0,
    framing_ok: true,
    label_ok: true,
  },
  observed_view: "uncertain",
  ar: {
    device_contour: [],
    device_bbox: null,
    components: [],
    glare_spots: [],
  },
};

export function useLiveCoach(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  intendedView: ViewName,
  intervalMs = 350
) {
  const [snapshot, setSnapshot] = useState<LiveCoachSnapshot>(EMPTY);
  const [online, setOnline] = useState(true);
  const [readyStreak, setReadyStreak] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(EMPTY);
      setReadyStreak(0);
      return;
    }

    let cancelled = false;
    let timer = 0;

    async function tick() {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
        );
        if (!blob || cancelled) return;
        const live = await analyzeLiveBlob(blob, intendedView);
        if (cancelled) return;
        setOnline(true);
        setReadyStreak((prev) => (live.ready ? prev + 1 : 0));
        setSnapshot(live);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }

    timer = window.setInterval(() => void tick(), intervalMs);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      setReadyStreak(0);
    };
  }, [enabled, intendedView, intervalMs, videoRef]);

  return {
    snapshot,
    online,
    readyStreak,
    apiReady: snapshot.ready && readyStreak >= 2,
  };
}

export function alignmentScore(
  guide: { x: number; y: number; w: number; h: number },
  detected: { x: number; y: number; w: number; h: number } | null
) {
  if (!detected) return 0.42;
  const gx = guide.x + guide.w / 2;
  const gy = guide.y + guide.h / 2;
  const dx = Math.abs(gx - (detected.x + detected.w / 2));
  const dy = Math.abs(gy - (detected.y + detected.h / 2));
  const sizeRatio =
    Math.min(guide.w * guide.h, detected.w * detected.h) /
    Math.max(guide.w * guide.h, detected.w * detected.h, 0.001);
  const center = 1 - Math.min(1, (dx + dy) * 1.6);
  return Math.round(Math.max(0, Math.min(1, center * 0.65 + sizeRatio * 0.35)) * 100);
}
