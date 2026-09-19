"use client";

import { useEffect, useState } from "react";

/** Timer-based lock ring for scripted demo — no motion detection. */
export function useFakeLock(
  enabled: boolean,
  captureReady: boolean,
  analyzing: boolean,
  lockMs: number,
  resetKey: number
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || !captureReady || analyzing) {
      setProgress(0);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / lockMs);
      setProgress(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, captureReady, analyzing, lockMs, resetKey]);

  const isStable = progress >= 0.96;

  return {
    progress,
    isStable,
    motion: isStable ? 0.02 : 0.18,
  };
}
