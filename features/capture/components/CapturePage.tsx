"use client";

// Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCaptureStore } from "../store/captureStore";
import { CameraPanel } from "./CameraPanel";
import { DemoWalkthrough } from "./DemoWalkthrough";
import { PassportDialog } from "./PassportDialog";
import { PerfectSetCelebration } from "./PerfectSetCelebration";
import { UploadPanel } from "./UploadPanel";

export function CapturePage() {
  const mode = useCaptureStore((s) => s.mode);
  const setMode = useCaptureStore((s) => s.setMode);

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="px-6 pt-8 pb-2 sm:px-10">
        <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
          American Circular · Bay Hacks
        </p>
        <h1 className="mt-3 text-[48px] font-medium uppercase leading-[0.9] tracking-tight sm:text-[72px]">
          ApertureGrade
        </h1>
        <p className="mt-4 max-w-xl text-base text-mute">
          Photograph electronic equipment correctly. Live coaching with auto-capture
          and retake loops, or upload American Circular photos for neural QC and a
          digital product passport.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge className="rounded-full bg-[#0a7281] text-white">
            OpenCV + MediaPipe
          </Badge>
          <div className="flex rounded-full bg-soft-cloud p-1">
            <Button
              size="sm"
              variant={mode === "demo" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setMode("demo")}
            >
              Demo voice
            </Button>
            <Button
              size="sm"
              variant={mode === "operator" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setMode("operator")}
            >
              Operator
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-10">
        <Tabs defaultValue="live" className="gap-8">
          <TabsList className="h-12 rounded-full bg-soft-cloud p-1">
            <TabsTrigger
              value="live"
              className="h-10 rounded-full px-5 data-active:bg-ink data-active:text-white"
            >
              Live Camera
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="h-10 rounded-full px-5 data-active:bg-ink data-active:text-white"
            >
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="script"
              className="h-10 rounded-full px-5 data-active:bg-ink data-active:text-white"
            >
              Demo script
            </TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="max-lg:px-0">
            <CameraPanel />
          </TabsContent>
          <TabsContent value="upload">
            <UploadPanel />
          </TabsContent>
          <TabsContent value="script">
            <DemoWalkthrough />
          </TabsContent>
        </Tabs>
      </main>

      <PerfectSetCelebration />
      <PassportDialog />
    </div>
  );
}
