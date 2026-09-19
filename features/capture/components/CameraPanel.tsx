"use client";

// Imports
import { Camera, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCaptureSession } from "../hooks/useCaptureSession";
import { useIsMobile } from "../hooks/useIsMobile";
import { useFakeLock } from "../hooks/useFakeLock";
import { alignmentScore, useLiveCoach } from "../hooks/useLiveCoach";
import { fallbackBox, useMediaPipeGuide } from "../hooks/useMediaPipeGuide";
import { pulseHaptic, useStabilityGate } from "../hooks/useStabilityGate";
import { useWebcam } from "../hooks/useWebcam";
import { useCaptureStore } from "../store/captureStore";
import { VIEW_COPY } from "../types";
import { scriptedCoachSnapshot } from "../utils/scriptedDemo";
import { primeAudioPlayback } from "../utils/voicePlayer";
import { ArGuideOverlay } from "./ArGuideOverlay";
import { AutoCaptureRing } from "./AutoCaptureRing";
import { DemoCoachBanner } from "./DemoCoachBanner";
import { LiveMetricsHud } from "./LiveMetricsHud";
import { RetakeCompare } from "./RetakeCompare";

export function CameraPanel() {
  // State
  const isMobile = useIsMobile();
  const mode = useCaptureStore((s) => s.mode);
  const rejectedByView = useCaptureStore((s) => s.rejectedByView);
  const retakeCount = useCaptureStore((s) => s.retakeCount);
  const {
    videoRef,
    active,
    error,
    hint,
    starting,
    start,
    stop,
    captureFrame,
  } = useWebcam();
  const session = useCaptureSession();
  const shots = useCaptureStore((s) => s.shots);
  const rejectedForView = rejectedByView[session.view];
  const retakePending = Boolean(rejectedForView);
  const retakeCoaching = retakePending && !session.captureReady;
  const coachEnabled = active && session.running;
  const liveCoachEnabled = !session.scripted && coachEnabled && (session.captureReady || retakePending);
  const { snapshot: liveSnapshot, online, apiReady } = useLiveCoach(
    videoRef,
    liveCoachEnabled,
    session.view
  );
  const { box } = useMediaPipeGuide(videoRef, active);
  const realStability = useStabilityGate(videoRef, coachEnabled && !session.scripted, undefined, retakeCount);
  const fakeStability = useFakeLock(
    session.scripted && coachEnabled,
    session.captureReady,
    session.analyzing,
    session.fakeLockMs,
    retakeCount + session.scriptStep
  );
  const stability = session.scripted ? fakeStability : realStability;
  const rejectedIssueCodes = rejectedForView?.result.issue_codes ?? [];
  const snapshot = session.scripted
    ? scriptedCoachSnapshot(session.view, retakeCoaching, rejectedIssueCodes)
    : liveSnapshot;
  const [frame, setFrame] = useState({ width: 1280, height: 720 });
  const firedRef = useRef(false);
  const immersive = isMobile && active;

  // Effects
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      if (video.videoWidth) {
        setFrame({ width: video.videoWidth, height: video.videoHeight });
      }
    };
    video.addEventListener("loadedmetadata", sync);
    sync();
    return () => video.removeEventListener("loadedmetadata", sync);
  }, [videoRef, active]);

  useEffect(() => {
    if (!immersive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersive]);

  const align = alignmentScore(fallbackBox(session.view), box);
  const lastAccepted = shots.find((s) => s.view === session.view);

  useEffect(() => {
    if (!session.captureReady || session.analyzing) {
      firedRef.current = false;
      return;
    }
    if (stability.progress < 0.12) {
      firedRef.current = false;
      return;
    }
    if (stability.progress >= 0.96 && stability.isStable && !firedRef.current) {
      firedRef.current = true;
      const dataUrl = captureFrame();
      if (!dataUrl) return;
      const pass = session.scripted
        ? stability.isStable
        : mode === "operator"
          ? apiReady && stability.isStable
          : stability.isStable;
      if (pass) {
        pulseHaptic();
        void session.capture(dataUrl);
      } else {
        firedRef.current = false;
      }
    }
  }, [
    align,
    apiReady,
    captureFrame,
    mode,
    session,
    stability.isStable,
    stability.progress,
  ]);

  // Functions
  async function onStart() {
    primeAudioPlayback();
    session.start();

    if (!active) {
      const ok = await start();
      if (!ok) session.reset();
    }
  }

  function onCapture() {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    void session.capture(dataUrl);
  }

  function onReset() {
    session.reset();
    stop();
  }

  const controlButtons = (
    <>
      <Button
        className="h-12 flex-1 rounded-full px-4 sm:px-8"
        onClick={onStart}
        disabled={starting}
      >
        {session.running ? "Restart" : "Start"}
      </Button>
      <Button
        className="h-12 flex-1 rounded-full px-4 sm:px-8"
        variant={session.captureReady ? "default" : "secondary"}
        onClick={onCapture}
        disabled={!session.captureReady || session.analyzing}
      >
        <Camera data-icon="inline-start" />
        Capture
      </Button>
      <Button
        className="h-12 shrink-0 rounded-full px-4"
        variant="secondary"
        size="icon"
        onClick={onReset}
      >
        <RotateCcw />
      </Button>
    </>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div
        className={
          immersive
            ? "fixed inset-0 z-[100] flex flex-col lg:static lg:inset-auto lg:z-auto lg:flex-none"
            : ""
        }
      >
        <div
          className={
            immersive
              ? "relative min-h-0 flex-1 overflow-hidden max-lg:pt-[env(safe-area-inset-top)] lg:aspect-[4/3] lg:overflow-hidden lg:bg-ink"
              : "relative aspect-[4/3] overflow-hidden bg-ink max-lg:min-h-[62dvh] max-lg:aspect-auto max-lg:w-full"
          }
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
          {active ? (
            <>
              <ArGuideOverlay
                width={frame.width}
                height={frame.height}
                detected={box}
                ready={session.captureReady}
                retake={retakeCoaching}
              />
              {session.running ? (
                <>
                  <AutoCaptureRing
                    progress={stability.progress}
                    stable={stability.isStable}
                    ready={session.captureReady}
                    analyzing={session.analyzing}
                    mobile={immersive}
                  />
                  {!immersive && !session.scripted ? (
                    <LiveMetricsHud
                      snapshot={snapshot}
                      alignment={align}
                      stableProgress={stability.progress}
                      motion={stability.motion}
                      online={session.scripted ? true : online}
                      mode={mode}
                      usableCount={shots.length}
                      retakeCount={retakeCount}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-soft-cloud">
              <p className="text-sm text-mute">Tap Start to open the camera</p>
            </div>
          )}
          <DemoCoachBanner
            kicker={`${VIEW_COPY[session.view].title} · ${
              session.analyzing
                ? "analyzing"
                : retakeCoaching
                  ? "retake"
                  : retakePending
                    ? "retry lock"
                    : session.captureReady
                      ? "auto-capture"
                      : "coaching"
            }`}
            caption={error || session.caption}
            compact={immersive}
          />
        </div>

        {immersive ? (
          <div className="shrink-0 border-t border-white/10 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
            <div className="flex gap-2">{controlButtons}</div>
            {hint ? (
              <p className="mt-3 text-xs leading-5 text-[#1151ff]">{hint}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`flex flex-col gap-6 ${immersive ? "max-lg:hidden" : ""}`}>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
            Guided session · {session.scripted ? "scripted demo" : mode}
          </p>
          <h2 className="mt-2 text-[32px] font-medium leading-[1.2]">
            {session.scripted ? "Ring fills automatically" : "Hold still to auto-capture"}
          </h2>
          <p className="mt-2 text-base text-mute">
            {session.scripted
              ? "Deterministic demo — simulated blur, dark, and glare retakes, then the ASUS ROG passport."
              : "Real OpenCV QC runs on every capture. Blur triggers a retake coach loop with before/after comparison."}
          </p>
          {hint ? (
            <p className="mt-3 rounded-2xl bg-[#1151ff]/8 px-4 py-3 text-sm text-[#1151ff]">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">{controlButtons}</div>

        <RetakeCompare
          rejected={rejectedByView}
          accepted={
            lastAccepted
              ? { view: lastAccepted.view, dataUrl: lastAccepted.dataUrl }
              : null
          }
        />

        <div className="flex flex-col gap-2">
          {shots.length === 0 ? (
            <p className="text-sm text-mute">No shots yet.</p>
          ) : (
            shots.map((shot) => (
              <div
                key={shot.id}
                className="flex items-center gap-3 bg-soft-cloud p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.dataUrl}
                  alt={shot.view}
                  className="size-16 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {VIEW_COPY[shot.view].title}
                  </p>
                  <p className="text-xs text-mute">{shot.id}</p>
                </div>
                <Badge className="bg-[#007d48] text-white">Usable</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
