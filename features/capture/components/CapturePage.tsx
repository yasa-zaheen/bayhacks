"use client";

// Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraPanel } from "./CameraPanel";
import { PassportDialog } from "./PassportDialog";
import { UploadPanel } from "./UploadPanel";

export function CapturePage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="px-6 pt-8 pb-2 sm:px-10">
        <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
          American Circular · Bay Hacks
        </p>
        <h1 className="mt-3 text-[48px] font-medium uppercase leading-[0.9] tracking-tight sm:text-[72px]">
          Poseidon
        </h1>
        <p className="mt-4 max-w-xl text-base text-mute">
          Photograph electronic equipment correctly. Live coaching for the demo,
          or upload American Circular photos for a real quality check and
          digital product passport.
        </p>
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
          </TabsList>
          <TabsContent value="live">
            <CameraPanel />
          </TabsContent>
          <TabsContent value="upload">
            <UploadPanel />
          </TabsContent>
        </Tabs>
      </main>

      <PassportDialog />
    </div>
  );
}
