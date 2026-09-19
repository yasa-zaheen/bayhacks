import type { DemoCueId } from "./demoScript";

const BASE = "/audio/aperturegrade-demo";

function audioPath(filename: string) {
  return `${BASE}/${encodeURIComponent(filename)}`;
}

/**
 * ElevenLabs MP3 map — drop files in public/audio/aperturegrade-demo/
 * Full list + scripts: public/audio/aperturegrade-demo/AUDIO_TO_RECORD.md
 */
export const APERTUREGRADE_DEMO_AUDIO: Record<DemoCueId, string> = {
  welcome: audioPath("welcome.mp3"),
  front: audioPath("step 1.mp3"),
  front_steady: audioPath("hold steady.mp3"),
  front_ready: audioPath("nice picture.mp3"),
  rear: audioPath("back.mp3"),
  rear_steady: audioPath("hold steady.mp3"),
  rear_ready: audioPath("capture the rear.mp3"),
  label: audioPath("serial_tag.mp3"),
  label_ready: audioPath("hold close.mp3"),
  finish: audioPath("all photos captured.mp3"),
  retake_blur: audioPath("retake_blur.mp3"),
  retake_glare: audioPath("retake_glare.mp3"),
  retake_dark: audioPath("retake_dark.mp3"),
  retake_framing: audioPath("retake_framing.mp3"),
  retake_label: audioPath("retake_framing.mp3"),
  retake_mismatch: audioPath("back.mp3"),
  retake_success: audioPath("retake_success.mp3"),
  accept_perfect_front: audioPath("perfect_front.mp3"),
  accept_perfect_rear: audioPath("perfect_rear.mp3"),
  accept_perfect_label: audioPath("perfect_label.mp3"),
};

export const APERTUREGRADE_DEMO_SCRIPTS: Record<DemoCueId, string> = {
  welcome:
    "Welcome to ApertureGrade. We'll capture three photos — the front, the back, and the serial tag.",
  front: "Step one — the front. Fill the frame with the device.",
  front_steady: "Hold steady… stop shaking for a moment.",
  front_ready: "Good. Hold still — I'll capture when you're locked in.",
  rear: "Step two — the back, where all the ports and details are.",
  rear_steady: "Hold steady… good.",
  rear_ready: "Much better. Hold steady on the rear — capturing now.",
  label: "Step three — the serial number or asset tag.",
  label_ready: "Good. Hold still — auto-capture when the tag is sharp.",
  finish: "All photos captured. Here's your digital passport.",
  retake_blur: "That photo is blurry. Hold the camera steady and try again.",
  retake_glare:
    "There's too much glare on the serial tag. Tilt the device or move the light.",
  retake_dark:
    "The contrast is too dark. Move it somewhere brighter, then try again.",
  retake_framing: "You're too close. Step back so the full tag is in frame.",
  retake_label: "Include more of the serial or model plate in frame, then retry.",
  retake_mismatch:
    "That looks like the wrong view. Match the coaching step and retry.",
  retake_success: "Much better. That shot passes quality checks.",
  accept_perfect_front: "Perfect. That front shot passes quality checks.",
  accept_perfect_rear: "Okay — now that's perfect. That's a perfect picture.",
  accept_perfect_label: "Okay — now that's perfect. That's a perfect picture.",
};

/** Ordered playback for the scripted video demo. */
export const DEMO_AUDIO_MANIFEST = [
  { file: "welcome.mp3", cue: "welcome" as const, required: true },
  { file: "step 1.mp3", cue: "front" as const, required: true },
  { file: "hold steady.mp3", cue: "front_steady" as const, required: true },
  { file: "nice picture.mp3", cue: "front_ready" as const, required: true },
  { file: "retake_blur.mp3", cue: "retake_blur" as const, required: true },
  { file: "perfect_front.mp3", cue: "accept_perfect_front" as const, required: true },
  { file: "back.mp3", cue: "rear" as const, required: true },
  { file: "retake_dark.mp3", cue: "retake_dark" as const, required: true },
  { file: "capture the rear.mp3", cue: "rear_ready" as const, required: true },
  { file: "perfect_rear.mp3", cue: "accept_perfect_rear" as const, required: true },
  { file: "serial_tag.mp3", cue: "label" as const, required: true },
  { file: "retake_glare.mp3", cue: "retake_glare" as const, required: true },
  { file: "retake_framing.mp3", cue: "retake_framing" as const, required: true },
  { file: "hold close.mp3", cue: "label_ready" as const, required: true },
  { file: "perfect_label.mp3", cue: "accept_perfect_label" as const, required: true },
  { file: "all photos captured.mp3", cue: "finish" as const, required: true },
] as const;
