import type { ViewName } from "../types";

export type MockStoryBeat = {
  id: string;
  step: number;
  title: string;
  imageId: string;
  view: ViewName;
  expectedStatus: "retake" | "usable";
  expectedIssues: string[];
  say: string;
  screen: string;
  rubric: string;
};

/** Deterministic American Circular images — no live camera luck required. */
export const MOCK_QC_STORY: MockStoryBeat[] = [
  {
    id: "blur-fail",
    step: 1,
    title: "Blurry front — retake",
    imageId: "IMG-0004",
    view: "front",
    expectedStatus: "retake",
    expectedIssues: ["blur"],
    say: "First capture is motion-blurred. Poseidon rejects it and tells the operator to hold steady — not a generic error.",
    screen:
      "Status: retake · issue blur · guidance: Hold the camera steady and refocus on the subject.",
    rubric: "Correct feedback (30) + specific retake guidance (25)",
  },
  {
    id: "dark-fail",
    step: 2,
    title: "Underexposed front — add light",
    imageId: "IMG-0006",
    view: "front",
    expectedStatus: "retake",
    expectedIssues: ["underexposed"],
    say: "Second attempt is too dark. We surface underexposed before blur checks — lighting is the actual problem.",
    screen:
      "Status: retake · issue underexposed · guidance: Add even lighting and retake without deep shadows.",
    rubric: "Correct feedback (30) + clear lighting instruction (25)",
  },
  {
    id: "front-pass",
    step: 3,
    title: "Sharp, lit front — accepted",
    imageId: "IMG-0001",
    view: "front",
    expectedStatus: "usable",
    expectedIssues: [],
    say: "Third front photo passes. Retake compare can show rejected vs accepted side by side on Live Camera.",
    screen: "Status: usable · no issue codes · front view locked.",
    rubric: "Accepts usable photos — avoids false alarms on clean shots (30)",
  },
];

export const MOCK_PASSPORT_SET = {
  setId: "SET-006",
  say: "Run SET-006 to show a complete usable set → digital passport, refurb route, and playbook unlock.",
  rubric: "Working prototype + usability payoff (20 + 10)",
};

export type LiveDemoStep = {
  step: number;
  title: string;
  mode: "demo" | "operator" | "both";
  action: string;
  say: string;
  screen: string;
};

export const LIVE_DEMO_SCRIPT: LiveDemoStep[] = [
  {
    step: 1,
    title: "Choose mode",
    mode: "both",
    action: "Live Camera tab. Toggle Demo voice (judges) or Operator (floor tech).",
    say: "Demo voice narrates the flow for judges. Operator is the silent production mode with live telemetry.",
    screen: "Header pills: Demo voice | Operator",
  },
  {
    step: 2,
    title: "Start session",
    mode: "both",
    action: "Tap Start. Allow camera.",
    say: "Poseidon opens the front step. MediaPipe tracks the device in your hand, not your face.",
    screen: "AR guide box on prop · coaching banner · stability ring",
  },
  {
    step: 3,
    title: "Blur retake (on purpose)",
    mode: "both",
    action: "Shake the laptop or prop for 2 seconds while the ring fills, then let auto-capture fire.",
    say: "OpenCV Laplacian variance flags blur. Voice says hold steady; retake compare shows the rejected frame.",
    screen: "RETake banner · retake_blur cue · orange compare card",
  },
  {
    step: 4,
    title: "Dark retake (on purpose)",
    mode: "both",
    action: "Cover the lens partially or turn away from window light. Capture again.",
    say: "Underexposure triggers before blur — the coach asks for better lighting, not another generic retry.",
    screen: "retake_dark cue · Live telemetry Light % drops · guidance from API",
  },
  {
    step: 5,
    title: "Good front",
    mode: "both",
    action: "Hold prop centered, fill ~40% of frame, hold still until ring completes.",
    say: "Much better — shot passes. Demo voice plays retake_success if you recovered from failures.",
    screen: "Usable badge · advance to rear step",
  },
  {
    step: 6,
    title: "Rear + serial tag",
    mode: "both",
    action: "Flip device for rear ports, then serial/asset tag close-up. Auto-capture each when stable.",
    say: "Three required views: front, rear_ports, label. No orange DEMO tape required in our flow.",
    screen: "3/3 views locked · passport dialog · celebration on perfect set",
  },
];

export const OPERATOR_MODE = {
  title: "Operator mode",
  summary:
    "Silent floor mode for a real technician. Same camera, retake loop, and passport — no scripted MP3 voice.",
  differences: [
    "No welcome / step voiceover — text coaching only from live QC.",
    "Auto-capture waits for stability and API-ready (sharpness + exposure gates), not stability alone.",
    "Live telemetry HUD: sharpness, alignment, stability, light, motion, API online.",
    "Retake guidance comes straight from OpenCV issue codes (blur, underexposed, framing, etc.).",
    "Retake compare and passport flow are identical to Demo voice mode.",
  ],
  whenToUse:
    "Use Demo voice for judges and recorded submissions. Use Operator when presenting live without audio or when you want the HUD visible.",
};

export const RUBRIC_TALKING_POINTS = [
  {
    points: 30,
    label: "Correct and useful feedback",
    line: "We classify blur, lighting, framing, and label readability with OpenCV on the original JPEG — judges can verify on IMG-0004 and IMG-0006.",
  },
  {
    points: 25,
    label: "Clear retake guidance",
    line: "Every issue code maps to one actionable sentence — hold steady, add light, step back — surfaced in voice, banner, and retake compare.",
  },
  {
    points: 20,
    label: "Working prototype",
    line: "Live camera + upload + American Circular SET-001…009; single bun dev starts Next.js and Python QC.",
  },
  {
    points: 15,
    label: "Thoughtful use of AI",
    line: "MediaPipe object guide for AR framing; OpenCV rules for pass/fail; we explain which checks are deterministic vs model-assisted.",
  },
  {
    points: 10,
    label: "Usability and presentation",
    line: "Demo script tab, operator mode, analysis theater, and passport playbook for circular routing.",
  },
];
