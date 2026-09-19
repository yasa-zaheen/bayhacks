"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCaptureStore } from "../store/captureStore";

export function PerfectSetCelebration() {
  const open = useCaptureStore((s) => s.celebrationOpen);
  const setOpen = useCaptureStore((s) => s.setCelebrationOpen);
  const retakeCount = useCaptureStore((s) => s.retakeCount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfect capture set</DialogTitle>
          <DialogDescription>All three views passed quality checks.</DialogDescription>
        </DialogHeader>
        <div className="celebration-burst overflow-hidden rounded-[28px] bg-linear-to-br from-[#007d48] via-[#0a7281] to-[#1151ff] p-8 text-white shadow-[0_24px_80px_rgba(0,125,72,0.35)]">
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase opacity-80">
            American Circular
          </p>
          <h2 className="mt-3 text-4xl font-medium uppercase leading-[0.95]">
            Perfect set
          </h2>
          <p className="mt-4 text-base text-white/85">
            All required views are usable. Poseidon unlocked the digital product
            passport and refurb route.
          </p>
          {retakeCount > 0 ? (
            <p className="mt-2 text-sm text-[#ffb0dd]">
              Recovered after {retakeCount} retake{retakeCount === 1 ? "" : "s"} — great coaching loop.
            </p>
          ) : null}
          <Button
            className="mt-6 h-12 w-full rounded-full bg-white text-ink hover:bg-white/90"
            onClick={() => setOpen(false)}
          >
            Open passport
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
