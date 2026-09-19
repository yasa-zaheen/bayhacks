import type { LiveCoachSnapshot } from "../api/qcClient";
import type { PhotoResult, SetResult, ViewName } from "../types";
import { LIVE_DEMO_DEVICE } from "./demoDeviceProfile";

export type ScriptedFail =
  | "blur"
  | "underexposed"
  | "glare_or_overexposed"
  | "framing";

type ScriptedStep =
  | { kind: "fail"; issue: ScriptedFail; view: ViewName }
  | { kind: "accept"; view: ViewName };

/** Linear capture script — same every demo run. */
export const SCRIPTED_CAPTURE_STEPS: ScriptedStep[] = [
  { kind: "fail", issue: "blur", view: "front" },
  { kind: "accept", view: "front" },
  { kind: "fail", issue: "underexposed", view: "rear_ports" },
  { kind: "accept", view: "rear_ports" },
  { kind: "fail", issue: "glare_or_overexposed", view: "label" },
  { kind: "fail", issue: "framing", view: "label" },
  { kind: "accept", view: "label" },
];

const FAIL_COPY: Record<
  ScriptedFail,
  { reason: string; guidance: string; retakeCue: string }
> = {
  blur: {
    reason: "Focus or motion blur obscures relevant detail.",
    guidance: "Hold the camera steady and refocus on the subject.",
    retakeCue: "That photo is blurry. Hold the camera steady and try again.",
  },
  underexposed: {
    reason: "The required subject is too dark to inspect reliably.",
    guidance: "Add even lighting and retake without deep shadows.",
    retakeCue: "The contrast is too dark. Move it somewhere brighter, then try again.",
  },
  glare_or_overexposed: {
    reason: "Excessive brightness or glare reduces visible subject detail.",
    guidance: "Move the light or change the camera angle to reduce glare.",
    retakeCue:
      "There's too much glare on the serial tag. Tilt the device or move the light.",
  },
  framing: {
    reason: "Part of the intended subject or label lies outside the frame.",
    guidance: "Reposition to include the complete required subject.",
    retakeCue: "You're too close. Step back so the full tag is in frame.",
  },
};

export function scriptedStepAt(index: number): ScriptedStep | null {
  return SCRIPTED_CAPTURE_STEPS[index] ?? null;
}

export function fakeAnalyzingMs(step: ScriptedStep): number {
  return step.kind === "fail" ? 900 : 700;
}

export function fakeLockMs(step: ScriptedStep | null): number {
  if (!step) return 2800;
  return step.kind === "fail" ? 3200 : 2600;
}

export function fakePhotoResult(
  view: ViewName,
  step: ScriptedStep,
  dataUrl?: string
): PhotoResult {
  const id = `DEMO-${view.toUpperCase()}-${step.kind === "fail" ? step.issue : "OK"}`;

  if (step.kind === "fail") {
    const copy = FAIL_COPY[step.issue];
    return {
      photo_id: id,
      intended_view: view,
      status: "retake",
      issue_codes: [step.issue],
      reason: copy.reason,
      retake_guidance: copy.guidance,
      observed_view: view,
      confidence: 0.92,
      metrics: { live_capture: true, scripted: true },
      components: [],
      demo_id: null,
      device_class: "gaming_laptop",
      view_mismatch: false,
      fraud_flags: [],
      localUri: dataUrl,
    };
  }

  return {
    photo_id: id,
    intended_view: view,
    status: "usable",
    issue_codes: [],
    reason: "Required detail is sufficiently visible for this intended view.",
    retake_guidance: "",
    observed_view: view,
    confidence: 0.94,
    metrics: { live_capture: true, scripted: true },
    components: [],
    demo_id: view === "label" ? LIVE_DEMO_DEVICE.asset_serial : null,
    device_class: "gaming_laptop",
    view_mismatch: false,
    fraud_flags: [],
    localUri: dataUrl,
  };
}

export function buildScriptedSetResult(
  accepted: { view: ViewName; dataUrl: string; result: PhotoResult }[]
): SetResult {
  const photos = accepted.map((item) => item.result);
  return {
    set_id: "SET-SCRIPTED-DEMO",
    missing_views: [],
    missing_reason: "Scripted demo — all three views captured.",
    photos,
    passport: {
      passport_id: "DPP-ROG-G531GT",
      issued_at: new Date().toISOString(),
      device_class: LIVE_DEMO_DEVICE.device_class,
      device_title: LIVE_DEMO_DEVICE.device_title,
      model: LIVE_DEMO_DEVICE.model,
      asset_serial: LIVE_DEMO_DEVICE.asset_serial,
      condition_grade: {
        letter: "A",
        label: "Excellent — list-ready",
        photo_score: 100,
        subscores: { photo_quality: 100, completeness: 100, integrity: 100 },
      },
      route: LIVE_DEMO_DEVICE.route,
      components: [],
      missing_views: [],
      fraud: { risk: "low", flags: [] },
      playbook: LIVE_DEMO_DEVICE.playbook,
      photos: photos.map((photo) => ({
        photo_id: photo.photo_id,
        intended_view: photo.intended_view,
        status: photo.status,
        issue_codes: photo.issue_codes,
      })),
    },
  };
}

export function scriptedCoachSnapshot(
  view: ViewName,
  retake: boolean,
  issueCodes: string[]
): LiveCoachSnapshot {
  const issue = issueCodes[0] as ScriptedFail | undefined;
  const failing = retake && issue;

  return {
    ready: !failing,
    status: failing ? "retake" : "usable",
    issue_codes: failing && issue ? [issue] : [],
    guidance: failing && issue ? FAIL_COPY[issue].guidance : "Looks good — hold still to capture.",
    metrics: {
      sharpness: failing && issue === "blur" ? 0.22 : 0.88,
      exposure: failing && issue === "underexposed" ? 0.18 : 0.76,
      glare: failing && issue === "glare_or_overexposed" ? 0.72 : 0.08,
      framing_ok: !(failing && issue === "framing"),
      label_ok: true,
    },
    observed_view: view,
    ar: {
      device_contour: [],
      device_bbox: null,
      components: [],
      glare_spots:
        failing && issue === "glare_or_overexposed"
          ? [[0.35, 0.4, 0.22, 0.18]]
          : [],
    },
  };
}
