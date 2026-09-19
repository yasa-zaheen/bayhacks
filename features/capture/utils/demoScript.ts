import type { Passport, PhotoResult, SetResult, Shot, ViewName } from "../types";

export type DemoCueId =
  | "welcome"
  | "front"
  | "front_steady"
  | "front_ready"
  | "rear"
  | "rear_steady"
  | "rear_ready"
  | "label"
  | "label_ready"
  | "finish"
  | "retake_blur"
  | "retake_glare"
  | "retake_dark"
  | "retake_framing"
  | "retake_label"
  | "retake_mismatch"
  | "retake_success"
  | "accept_perfect_front"
  | "accept_perfect_rear"
  | "accept_perfect_label";

export type DemoCue = {
  id: DemoCueId;
  view: ViewName;
  line: string;
  captureReady: boolean;
  delayMs: number;
};

export const DEMO_CUES: Record<DemoCueId, DemoCue> = {
  welcome: {
    id: "welcome",
    view: "front",
    line: "Welcome to Poseidon. Let's start by taking some pictures.",
    captureReady: false,
    delayMs: 4500,
  },
  front: {
    id: "front",
    view: "front",
    line: "Step one — front. Include the outer edges of the device.",
    captureReady: false,
    delayMs: 3000,
  },
  front_steady: {
    id: "front_steady",
    view: "front",
    line: "Hold steady… stop shaking for a moment.",
    captureReady: false,
    delayMs: 2500,
  },
  front_ready: {
    id: "front_ready",
    view: "front",
    line: "That's a nice picture. Tap capture when you're ready.",
    captureReady: true,
    delayMs: 0,
  },
  rear: {
    id: "rear",
    view: "rear_ports",
    line: "Step two — the back, where all the ports and details are.",
    captureReady: false,
    delayMs: 3000,
  },
  rear_steady: {
    id: "rear_steady",
    view: "rear_ports",
    line: "Hold steady… good.",
    captureReady: false,
    delayMs: 2000,
  },
  rear_ready: {
    id: "rear_ready",
    view: "rear_ports",
    line: "Much better. Hold steady on the rear — capturing now.",
    captureReady: true,
    delayMs: 0,
  },
  label: {
    id: "label",
    view: "label",
    line: "Step three — the serial number or asset tag.",
    captureReady: false,
    delayMs: 2800,
  },
  label_ready: {
    id: "label_ready",
    view: "label",
    line: "Good. Hold still — auto-capture when the tag is sharp.",
    captureReady: true,
    delayMs: 0,
  },
  finish: {
    id: "finish",
    view: "label",
    line: "All photos captured. Here's your digital passport.",
    captureReady: false,
    delayMs: 0,
  },
  retake_blur: {
    id: "retake_blur",
    view: "front",
    line: "That photo is blurry. Hold the camera steady and try again.",
    captureReady: false,
    delayMs: 0,
  },
  retake_glare: {
    id: "retake_glare",
    view: "label",
    line: "There's too much glare on the serial tag. Tilt the device or move the light.",
    captureReady: false,
    delayMs: 0,
  },
  retake_dark: {
    id: "retake_dark",
    view: "rear_ports",
    line: "The contrast is too dark. Move it somewhere brighter, then try again.",
    captureReady: false,
    delayMs: 0,
  },
  retake_framing: {
    id: "retake_framing",
    view: "label",
    line: "You're too close. Step back so the full tag is in frame.",
    captureReady: false,
    delayMs: 0,
  },
  retake_label: {
    id: "retake_label",
    view: "label",
    line: "Include more of the serial or model plate in frame, then retry.",
    captureReady: false,
    delayMs: 0,
  },
  retake_mismatch: {
    id: "retake_mismatch",
    view: "front",
    line: "That looks like the wrong view. Match the coaching step and retry.",
    captureReady: false,
    delayMs: 0,
  },
  retake_success: {
    id: "retake_success",
    view: "front",
    line: "Much better. That shot passes quality checks.",
    captureReady: false,
    delayMs: 0,
  },
  accept_perfect_front: {
    id: "accept_perfect_front",
    view: "front",
    line: "Perfect. That front shot passes quality checks.",
    captureReady: false,
    delayMs: 0,
  },
  accept_perfect_rear: {
    id: "accept_perfect_rear",
    view: "rear_ports",
    line: "Okay — now that's perfect. That's a perfect picture.",
    captureReady: false,
    delayMs: 0,
  },
  accept_perfect_label: {
    id: "accept_perfect_label",
    view: "label",
    line: "Okay — now that's perfect. That's a perfect picture.",
    captureReady: false,
    delayMs: 0,
  },
};

const NEXT_AFTER_CUE: Partial<Record<DemoCueId, DemoCueId>> = {
  welcome: "front",
  front: "front_steady",
  front_steady: "front_ready",
  rear: "rear_steady",
  rear_steady: "rear_ready",
  label: "label_ready",
};

const NEXT_AFTER_CAPTURE: Partial<Record<ViewName, DemoCueId>> = {
  front: "rear",
  rear_ports: "label_ready",
};

export function nextAutoCue(id: DemoCueId): DemoCueId | null {
  return NEXT_AFTER_CUE[id] ?? null;
}

export function nextCueAfterCapture(view: ViewName): DemoCueId | "finish" {
  return NEXT_AFTER_CAPTURE[view] ?? "finish";
}

const STEADY_CUE: Partial<Record<ViewName, DemoCueId>> = {
  front: "front_steady",
  rear_ports: "rear_steady",
  label: "label_ready",
};

export function steadyCueForView(view: ViewName): DemoCueId {
  return STEADY_CUE[view] ?? "front_steady";
}

export function readyCueForView(view: ViewName): DemoCueId {
  if (view === "front") return "front_ready";
  if (view === "rear_ports") return "rear_ready";
  return "label_ready";
}

export function perfectCueForView(view: ViewName): DemoCueId {
  if (view === "front") return "accept_perfect_front";
  if (view === "rear_ports") return "accept_perfect_rear";
  return "accept_perfect_label";
}

export function retakeCueFromResult(
  issueCodes: string[],
  viewMismatch: boolean,
  view: ViewName
): DemoCueId {
  if (viewMismatch) return "retake_mismatch";
  if (issueCodes.includes("blur")) return "retake_blur";
  if (issueCodes.includes("glare_or_overexposed")) return "retake_glare";
  if (issueCodes.includes("underexposed")) return "retake_dark";
  if (issueCodes.includes("label_obstructed")) return "retake_label";
  if (issueCodes.includes("framing")) {
    return view === "label" ? "retake_label" : "retake_framing";
  }
  return "retake_blur";
}

export function patchCueView(id: DemoCueId, view: ViewName): DemoCue {
  return { ...DEMO_CUES[id], view };
}

const MOCK_PLAYBOOK = [
  {
    step: 1,
    title: "Release the side panel",
    body: "Press the rear latch and slide the left panel off. No tools for most OptiPlex towers.",
  },
  {
    step: 2,
    title: "Harvest DIMMs",
    body: "Open the white retention clips on each RAM slot and pull modules straight out. Bag and label.",
  },
  {
    step: 3,
    title: "Remove drives",
    body: 'Slide the optical bay and 3.5" caddy out. Keep screws with the chassis.',
  },
  {
    step: 4,
    title: "PSU last",
    body: "Unplug 24-pin and CPU power, remove four rear screws, lift the PSU. Route to metal recovery if dead.",
  },
];

export function buildMockResult(shots: Shot[]): SetResult {
  const photos: PhotoResult[] = shots.map((shot) => ({
    photo_id: shot.id,
    intended_view: shot.view,
    status: "usable",
    issue_codes: [],
    reason: "Required detail is sufficiently visible for this intended view.",
    retake_guidance: "",
    observed_view: shot.view,
    confidence: 0.94,
    metrics: {},
    components: [],
    demo_id: shot.view === "label" ? "DEMO-present" : null,
    device_class: "desktop_tower",
    view_mismatch: false,
    fraud_flags: [],
    localUri: shot.dataUrl,
  }));

  const passport: Passport = {
    passport_id: "DPP-POSEIDON01",
    issued_at: "2026-09-19T15:00:00.000Z",
    device_class: "desktop_tower",
    device_title: "Desktop tower",
    condition_grade: {
      letter: "A",
      label: "Excellent — list-ready",
      photo_score: 100,
      subscores: {
        photo_quality: 100,
        completeness: 100,
        integrity: 100,
      },
    },
    route: {
      code: "refurb",
      title: "Refurbish",
      reason:
        "Complete usable set and solid cosmetic grade — send to refurb / resale.",
      est_value_usd: 85,
      co2_kg_saved: 14.2,
      materials: {
        steel: 42,
        aluminum: 8,
        copper: 12,
        plastics: 28,
        precious: 10,
      },
    },
    components: [
      {
        id: "demo_label",
        label: "DEMO challenge label",
        confidence: 0.9,
        bbox: [0.2, 0.2, 0.4, 0.2],
      },
    ],
    missing_views: [],
    fraud: { risk: "low", flags: [] },
    playbook: MOCK_PLAYBOOK,
    photos: photos.map((photo) => ({
      photo_id: photo.photo_id,
      intended_view: photo.intended_view,
      status: photo.status,
      issue_codes: photo.issue_codes,
    })),
  };

  return {
    set_id: "SET-DEMO",
    missing_views: [],
    missing_reason:
      "All three intended views supplied; quality must still be assessed.",
    photos,
    passport,
  };
}
