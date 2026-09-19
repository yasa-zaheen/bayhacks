"use client";

// Imports
import { Camera, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoScript } from "../hooks/useDemoScript";
import { useMediaPipeGuide } from "../hooks/useMediaPipeGuide";
import { useWebcam } from "../hooks/useWebcam";
import { useCaptureStore } from "../store/captureStore";
import { VIEW_COPY } from "../types";
import { primeAudioPlayback } from "../utils/voicePlayer";
import { ArGuideOverlay } from "./ArGuideOverlay";
import { DemoCoachBanner } from "./DemoCoachBanner";

export function CameraPanel() {
  // State
  const {
    videoRef,
    active,
    error,
    starting,
    start,
    stop,
    captureFrame,
  } = useWebcam();
  const demo = useDemoScript();
  const shots = useCaptureStore((s) => s.shots);
  const { box, label } = useMediaPipeGuide(videoRef, active);
  const [frame, setFrame] = useState({ width: 1280, height: 720 });

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
    return () => video.removeEventListener("loadedmetadata", sync);
  }, [videoRef, active]);

  // Functions
  async function onStart() {
    primeAudioPlayback();
    demo.start();

    if (!active) {
      const ok = await start();
      if (!ok) demo.reset();
    }
  }

  function onCapture() {
    const dataUrl = captureFrame();
    if (!dataUrl) return;
    demo.capture(dataUrl);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {active ? (
          <ArGuideOverlay
            width={frame.width}
            height={frame.height}
            view={demo.view}
            ready={demo.captureReady}
            detected={box}
            detectedLabel={label}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-soft-cloud">
            <p className="text-sm text-mute">Camera off</p>
          </div>
        )}
        <DemoCoachBanner
          kicker={`${VIEW_COPY[demo.view].title} · ${demo.captureReady ? "ready" : "coaching"}`}
          caption={error || demo.caption}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
            Guided session
          </p>
          <h2 className="mt-2 text-[32px] font-medium leading-[1.2]">
            Three required views
          </h2>
          <p className="mt-2 text-base text-mute">
            Front, rear ports, then the DEMO label. Voice lines are scripted so
            every demo sounds the same.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            className="h-12 rounded-full px-8"
            onClick={onStart}
            disabled={starting}
          >
            {demo.running ? "Restart session" : "Start session"}
          </Button>
          <Button
            className="h-12 rounded-full px-8"
            variant={demo.captureReady ? "default" : "secondary"}
            onClick={onCapture}
            disabled={!demo.captureReady}
          >
            <Camera data-icon="inline-start" />
            Capture
          </Button>
          <Button
            className="h-12 rounded-full px-4"
            variant="secondary"
            size="icon"
            onClick={() => {
              demo.reset();
              stop();
            }}
          >
            <RotateCcw />
          </Button>
        </div>

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
                <Badge variant="secondary">Saved</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
