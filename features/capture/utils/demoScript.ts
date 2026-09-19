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
  | "finish";

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
    line: "Now move to the back. Show the ports and connectors.",
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
    line: "Looks aligned. Capture the rear now.",
    captureReady: true,
    delayMs: 0,
  },
  label: {
    id: "label",
    view: "label",
    line: "Last — the DEMO label. Get the orange tape in frame.",
    captureReady: false,
    delayMs: 2800,
  },
  label_ready: {
    id: "label_ready",
    view: "label",
    line: "Hold close and tap capture.",
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
  rear_ports: "label",
};

export function nextAutoCue(id: DemoCueId): DemoCueId | null {
  return NEXT_AFTER_CUE[id] ?? null;
}

export function nextCueAfterCapture(view: ViewName): DemoCueId | "finish" {
  return NEXT_AFTER_CAPTURE[view] ?? "finish";
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
