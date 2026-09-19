"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildMockResult,
  DEMO_CUES,
  nextAutoCue,
  nextCueAfterCapture,
  type DemoCue,
  type DemoCueId,
} from "../utils/demoScript";
import { POSEIDON_DEMO_AUDIO } from "../utils/demoAudio";
import { playMp3, stopVoice } from "../utils/voicePlayer";
import { useCaptureStore } from "../store/captureStore";
import type { ViewName } from "../types";

export function useDemoScript() {
  const addShot = useCaptureStore((s) => s.addShot);
  const setResult = useCaptureStore((s) => s.setResult);
  const resetSession = useCaptureStore((s) => s.resetSession);

  const [cue, setCue] = useState<DemoCue | null>(null);
  const [running, setRunning] = useState(false);
  const playCueRef = useRef<(id: DemoCueId) => void>(() => undefined);

  useEffect(() => {
    playCueRef.current = (id: DemoCueId) => {
      const next = DEMO_CUES[id];
      setCue(next);

      void playMp3(POSEIDON_DEMO_AUDIO[id]).then(() => {
        const auto = nextAutoCue(id);
        if (auto && !next.captureReady) {
          playCueRef.current(auto);
        }
      });
    };
  }, []);

  const start = useCallback(() => {
    resetSession();
    setRunning(true);
    playCueRef.current("welcome");
  }, [resetSession]);

  const reset = useCallback(() => {
    setRunning(false);
    setCue(null);
    stopVoice();
    resetSession();
  }, [resetSession]);

  const capture = useCallback(
    (dataUrl: string) => {
      if (!cue?.captureReady) return false;
      const view: ViewName = cue.view;
      const shot = {
        id: `DEMO-${view.toUpperCase()}`,
        view,
        dataUrl,
      };
      addShot(shot);
      const upcoming = nextCueAfterCapture(view);
      if (upcoming === "finish") {
        const allShots = useCaptureStore.getState().shots;
        const result = buildMockResult(allShots);
        const uris: Record<string, string> = {};
        for (const item of allShots) uris[item.id] = item.dataUrl;
        setCue(DEMO_CUES.finish);
        setRunning(false);
        void playMp3(POSEIDON_DEMO_AUDIO.finish).then(() => {
          setResult(result, uris);
        });
        return true;
      }
      playCueRef.current(upcoming);
      return true;
    },
    [addShot, cue, setResult]
  );

  useEffect(() => {
    return () => stopVoice();
  }, []);

  return {
    cue,
    running,
    view: cue?.view ?? "front",
    caption: cue?.line ?? "Tap Start session to begin the guided demo.",
    captureReady: Boolean(cue?.captureReady),
    start,
    reset,
    capture,
  };
}
