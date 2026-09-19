import type { DemoCueId } from "./demoScript";

const BASE = "/audio/poseidon-demo";

function audioPath(filename: string) {
  return `${BASE}/${encodeURIComponent(filename)}`;
}

/** MP3 paths under public/audio/poseidon-demo/ (spaces are URL-encoded). */
export const POSEIDON_DEMO_AUDIO: Record<DemoCueId, string> = {
  welcome: audioPath("welcome.mp3"),
  front: audioPath("step 1.mp3"),
  front_steady: audioPath("hold steady.mp3"),
  front_ready: audioPath("nice picture.mp3"),
  rear: audioPath("back.mp3"),
  rear_steady: audioPath("hold steady.mp3"),
  rear_ready: audioPath("capture the rear.mp3"),
  label: audioPath("demo label.mp3"),
  label_ready: audioPath("hold close.mp3"),
  finish: audioPath("all photos captured.mp3"),
};

/** Exact ElevenLabs script blocks — one MP3 per entry. */
export const POSEIDON_DEMO_SCRIPTS: Record<DemoCueId, string> = {
  welcome: "Welcome to Poseidon. Let's start by taking some pictures.",
  front: "Step one — front. Include the outer edges of the device.",
  front_steady: "Hold steady… stop shaking for a moment.",
  front_ready: "That's a nice picture. Tap capture when you're ready.",
  rear: "Now move to the back. Show the ports and connectors.",
  rear_steady: "Hold steady… good.",
  rear_ready: "Looks aligned. Capture the rear now.",
  label: "Last — the DEMO label. Get the orange tape in frame.",
  label_ready: "Hold close and tap capture.",
  finish: "All photos captured. Here's your digital passport.",
};
