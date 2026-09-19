"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEMO_CUES,
  nextAutoCue,
  nextCueAfterCapture,
  patchCueView,
  perfectCueForView,
  readyCueForView,
  retakeCueFromResult,
  steadyCueForView,
  type DemoCue,
  type DemoCueId,
} from "../utils/demoScript";
import { applyLiveDemoPassport } from "../utils/demoDeviceProfile";
import { APERTUREGRADE_DEMO_AUDIO } from "../utils/demoAudio";
import {
  buildScriptedSetResult,
  fakeAnalyzingMs,
  fakeLockMs,
  fakePhotoResult,
  scriptedStepAt,
} from "../utils/scriptedDemo";
import { playMp3, stopVoice } from "../utils/voicePlayer";
import { useCaptureStore } from "../store/captureStore";
import type { PhotoResult, ViewName } from "../types";
import { REQUIRED_VIEWS } from "../types";

export function useCaptureSession() {
  const mode = useCaptureStore((s) => s.mode);
  const scripted = mode === "demo";
  const addShot = useCaptureStore((s) => s.addShot);
  const setRejected = useCaptureStore((s) => s.setRejected);
  const setResult = useCaptureStore((s) => s.setResult);
  const setCelebrationOpen = useCaptureStore((s) => s.setCelebrationOpen);
  const resetSession = useCaptureStore((s) => s.resetSession);
  const shots = useCaptureStore((s) => s.shots);

  const [cue, setCue] = useState<DemoCue | null>(null);
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scriptStep, setScriptStep] = useState(0);
  const [lastAccepted, setLastAccepted] = useState<PhotoResult | null>(null);
  const playCueRef = useRef<(id: DemoCueId, view?: ViewName) => void>(() => undefined);
  const autoLockRef = useRef(false);
  const scriptStepRef = useRef(0);

  const playCue = useCallback((id: DemoCueId, view?: ViewName, lineOverride?: string) => {
    const base = view ? patchCueView(id, view) : DEMO_CUES[id];
    setCue(lineOverride ? { ...base, line: lineOverride } : base);
    if (mode === "demo") {
      void playMp3(APERTUREGRADE_DEMO_AUDIO[id]).then(() => {
        const auto = nextAutoCue(id);
        if (
          auto &&
          !base.captureReady &&
          !id.startsWith("retake") &&
          !id.startsWith("accept_perfect")
        ) {
          playCueRef.current(auto, base.view);
        }
        if (id.startsWith("retake") && id !== "retake_success") {
          playCueRef.current(steadyCueForView(base.view), base.view);
        }
      });
    }
  }, [mode]);

  useEffect(() => {
    playCueRef.current = playCue;
  }, [playCue]);

  const goReady = useCallback(
    (view: ViewName) => {
      if (mode === "operator") {
        setCue({
          id: readyCueForView(view),
          view,
          line: "Hold still — auto-capture when ApertureGrade locks the frame.",
          captureReady: true,
          delayMs: 0,
        });
        return;
      }
      playCue(readyCueForView(view), view);
    },
    [mode, playCue]
  );

  const start = useCallback(() => {
    resetSession();
    setRunning(true);
    setLastAccepted(null);
    setScriptStep(0);
    scriptStepRef.current = 0;
    autoLockRef.current = false;
    if (mode === "operator") {
      setCue({
        ...DEMO_CUES.front,
        line: "Operator mode — point at the front of the device.",
        captureReady: false,
      });
      window.setTimeout(() => goReady("front"), 300);
      return;
    }
    playCue("welcome");
  }, [goReady, mode, playCue, resetSession]);

  const reset = useCallback(() => {
    setRunning(false);
    setCue(null);
    setAnalyzing(false);
    setScriptStep(0);
    scriptStepRef.current = 0;
    setLastAccepted(null);
    autoLockRef.current = false;
    stopVoice();
    resetSession();
  }, [resetSession]);

  const handleRetake = useCallback(
    (view: ViewName, dataUrl: string, result: PhotoResult) => {
      setRejected({ view, dataUrl, result });
      autoLockRef.current = false;
      const retakeId = retakeCueFromResult(
        result.issue_codes,
        result.view_mismatch,
        view
      );
      const patched = patchCueView(retakeId, view);
      const line = result.retake_guidance || patched.line;
      setCue({ ...patched, line, captureReady: false });
      if (mode === "demo") playCue(retakeId, view, line);
      else goReady(view);
    },
    [goReady, mode, playCue, setRejected]
  );

  const finishSession = useCallback(
    async (accepted: { view: ViewName; dataUrl: string; result: PhotoResult }[]) => {
      setCue(DEMO_CUES.finish);
      setRunning(false);
      if (mode === "demo") {
        await playMp3(APERTUREGRADE_DEMO_AUDIO.finish);
      }

      const uris: Record<string, string> = {};
      accepted.forEach((item) => {
        uris[item.result.photo_id] = item.dataUrl;
      });

      if (scripted) {
        setCelebrationOpen(true);
        setResult(applyLiveDemoPassport(buildScriptedSetResult(accepted)), uris);
        return;
      }

      try {
        const { analyzeSet } = await import("../api/analyze");
        const { dataUrlToBlob } = await import("../api/qcClient");
        const payload = accepted.map((item) => ({
          file: dataUrlToBlob(item.dataUrl),
          intended_view: item.view,
          name: `${item.view}.jpg`,
        }));
        const result = await analyzeSet(payload);
        result.photos.forEach((photo, index) => {
          if (accepted[index]) uris[photo.photo_id] = accepted[index].dataUrl;
        });
        const allUsable = result.photos.every((p) => p.status === "usable");
        const noMissing = result.missing_views.length === 0;
        if (allUsable && noMissing) {
          setCelebrationOpen(true);
        }
        setResult(applyLiveDemoPassport(result), uris);
      } catch {
        setResult(
          applyLiveDemoPassport(buildScriptedSetResult(accepted)),
          uris
        );
        setCelebrationOpen(true);
      }
    },
    [mode, scripted, setCelebrationOpen, setResult]
  );

  const capture = useCallback(
    async (dataUrl: string) => {
      if (!cue?.captureReady || analyzing || autoLockRef.current) return false;
      autoLockRef.current = true;
      setAnalyzing(true);
      const view = cue.view;

      try {
        let result: PhotoResult;

        if (scripted) {
          const step = scriptedStepAt(scriptStepRef.current);
          if (!step || step.view !== view) {
            autoLockRef.current = false;
            setAnalyzing(false);
            return false;
          }
          await new Promise((r) => setTimeout(r, fakeAnalyzingMs(step)));
          result = fakePhotoResult(view, step, dataUrl);
          scriptStepRef.current += 1;
          setScriptStep(scriptStepRef.current);
        } else {
          const { analyzePhotoBlob, dataUrlToBlob } = await import("../api/qcClient");
          const blob = dataUrlToBlob(dataUrl);
          result = await analyzePhotoBlob(blob, view, "", true);
        }

        if (result.status === "retake") {
          handleRetake(view, dataUrl, result);
          return false;
        }

        const hadReject = Boolean(useCaptureStore.getState().rejectedByView[view]);
        const shot = {
          id: result.photo_id || `LIVE-${view.toUpperCase()}`,
          view,
          dataUrl,
        };
        addShot(shot, result);
        setLastAccepted(result);

        if (hadReject && mode === "demo") {
          const perfectId = perfectCueForView(view);
          setCue({
            ...patchCueView(perfectId, view),
            line: DEMO_CUES[perfectId].line,
            captureReady: false,
          });
          await playMp3(APERTUREGRADE_DEMO_AUDIO[perfectId]);
        }

        const acceptedViews = new Set([
          ...useCaptureStore.getState().shots.map((s) => s.view),
        ]);
        const complete = REQUIRED_VIEWS.every((v) => acceptedViews.has(v));

        if (complete) {
          const all = useCaptureStore.getState().shots.map((s) => ({
            view: s.view,
            dataUrl: s.dataUrl,
            result: useCaptureStore.getState().photoResults[s.id],
          }));
          await finishSession(all);
          return true;
        }

        const upcoming = nextCueAfterCapture(view);
        if (upcoming === "finish") {
          await finishSession(
            useCaptureStore.getState().shots.map((s) => ({
              view: s.view,
              dataUrl: s.dataUrl,
              result: useCaptureStore.getState().photoResults[s.id],
            }))
          );
        } else if (mode === "demo") {
          playCue(upcoming);
        } else {
          const nextView = DEMO_CUES[upcoming].view;
          setCue({
            ...patchCueView(upcoming, nextView),
            captureReady: false,
          });
          window.setTimeout(() => goReady(nextView), 400);
        }
        return true;
      } catch {
        setCue({
          ...cue,
          line: scripted
            ? "Demo capture error — tap Restart."
            : "Analysis offline — run `bun dev` on your laptop (starts web + OpenCV).",
          captureReady: true,
        });
        return false;
      } finally {
        setAnalyzing(false);
        autoLockRef.current = false;
      }
    },
    [addShot, analyzing, cue, finishSession, handleRetake, mode, playCue, scripted, goReady]
  );

  const tryAutoCapture = useCallback(
    (dataUrl: string, gates: { stable: boolean; apiReady: boolean }) => {
      if (!cue?.captureReady || analyzing) return;
      const pass = scripted
        ? gates.stable
        : mode === "operator"
          ? gates.apiReady && gates.stable
          : gates.stable;
      if (pass) void capture(dataUrl);
    },
    [analyzing, capture, cue, mode, scripted]
  );

  useEffect(() => () => stopVoice(), []);

  const scriptedStep = scriptedStepAt(scriptStep);

  return {
    cue,
    running,
    analyzing,
    scripted,
    scriptStep,
    fakeLockMs: fakeLockMs(scriptedStep),
    view: cue?.view ?? "front",
    caption:
      cue?.line ??
      (mode === "operator"
        ? "Operator mode — live OpenCV coach with auto-capture."
        : "Tap Start session to begin the scripted demo."),
    captureReady: Boolean(cue?.captureReady) && !analyzing,
    shots,
    lastAccepted,
    start,
    reset,
    capture,
    tryAutoCapture,
    goReady,
  };
}
