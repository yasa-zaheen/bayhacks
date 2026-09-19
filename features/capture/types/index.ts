export const REQUIRED_VIEWS = ["front", "rear_ports", "label"] as const;
export type ViewName = (typeof REQUIRED_VIEWS)[number];

export const VIEW_COPY: Record<ViewName, { title: string; hint: string }> = {
  front: { title: "Front", hint: "Include the outer edges of the device." },
  rear_ports: {
    title: "Rear / ports",
    hint: "Show the connection side and connectors.",
  },
  label: {
    title: "Serial / asset tag",
    hint: "Close-up of the sticker, model plate, or serial number — no orange DEMO tape needed.",
  },
};

export type PhotoStatus = "usable" | "retake" | "needs_review";

export type PhotoComponent = {
  id: string;
  label: string;
  confidence: number;
  bbox: number[];
};

export type PhotoResult = {
  photo_id: string;
  intended_view: string;
  status: PhotoStatus;
  issue_codes: string[];
  reason: string;
  retake_guidance: string;
  observed_view: string;
  confidence: number;
  metrics: Record<string, unknown>;
  components: PhotoComponent[];
  demo_id: string | null;
  device_class: string;
  view_mismatch: boolean;
  fraud_flags: string[];
  localUri?: string;
};

export type Passport = {
  passport_id: string;
  issued_at: string;
  device_class: string;
  device_title: string;
  model?: string;
  asset_serial?: string;
  condition_grade: {
    letter: string;
    label: string;
    photo_score: number;
    subscores: Record<string, number>;
  };
  route: {
    code: string;
    title: string;
    reason: string;
    est_value_usd: number;
    co2_kg_saved: number;
    materials: Record<string, number>;
  };
  components: PhotoComponent[];
  missing_views: string[];
  fraud: {
    risk: string;
    flags: { photo_id?: string; code: string; detail: string }[];
  };
  playbook: { step: number; title: string; body: string }[];
  photos: {
    photo_id: string;
    intended_view: string;
    status: string;
    issue_codes: string[];
  }[];
};

export type SetResult = {
  set_id: string;
  missing_views: string[];
  missing_reason: string;
  photos: PhotoResult[];
  passport: Passport;
};

export type PracticeSet = {
  set_id: string;
  device_id: string;
  photos: { image_id: string; intended_view: string }[];
  missing_views: string[];
};

export type PracticeCatalog = {
  devices: Record<string, { image_id: string; path: string }[]>;
  sets: PracticeSet[];
};

export type Shot = {
  id: string;
  view: ViewName;
  dataUrl: string;
};

export type GuideBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CoachMode = "demo" | "operator";

export type LiveArOverlay = {
  contour: number[][];
  glareSpots: number[][];
  deviceBbox: number[] | null;
  alignmentScore: number;
};
