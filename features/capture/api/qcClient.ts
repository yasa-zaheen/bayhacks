import { apiUrl } from "./analyze";
import type { PhotoResult, ViewName } from "../types";

export type LiveCoachSnapshot = {
  ready: boolean;
  status: string;
  issue_codes: string[];
  guidance: string;
  metrics: {
    sharpness: number;
    exposure: number;
    glare: number;
    framing_ok: boolean;
    label_ok: boolean;
  };
  observed_view: string;
  ar: {
    device_contour: number[][];
    device_bbox: number[] | null;
    components: { id: string; label: string; confidence: number; bbox: number[] }[];
    glare_spots: number[][];
  };
};

export type PracticeLabels = {
  photos: {
    image_id: string;
    observed_view: string;
    status: string;
    issue_codes: string;
    reason: string;
    retake_guidance: string;
  }[];
  sets: { set_id: string; missing_views: string; reason: string }[];
};

export async function analyzePhotoBlob(
  blob: Blob,
  intendedView: ViewName,
  photoId = "",
  live = false
): Promise<PhotoResult> {
  const fd = new FormData();
  fd.append("file", blob, "capture.jpg");
  fd.append("intended_view", intendedView);
  if (photoId) fd.append("photo_id", photoId);
  if (live) fd.append("live", "1");

  const res = await fetch(`${apiUrl()}/analyze/photo`, { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error((await res.text()) || "Photo analysis failed");
  }
  return res.json();
}

export async function analyzeLiveBlob(
  blob: Blob,
  intendedView: ViewName
): Promise<LiveCoachSnapshot> {
  const fd = new FormData();
  fd.append("file", blob, "frame.jpg");
  fd.append("intended_view", intendedView);

  const res = await fetch(`${apiUrl()}/analyze/live`, { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error((await res.text()) || "Live analysis failed");
  }
  return res.json();
}

export async function fetchPracticeLabels(): Promise<PracticeLabels> {
  const res = await fetch(`${apiUrl()}/practice/labels`);
  if (!res.ok) throw new Error("Could not load practice labels");
  const raw = (await res.json()) as {
    photos: PracticeLabels["photos"] | Record<string, PracticeLabels["photos"][number]>;
    sets: PracticeLabels["sets"] | Record<string, PracticeLabels["sets"][number]>;
  };

  const photos = Array.isArray(raw.photos)
    ? raw.photos
    : Object.values(raw.photos ?? {});
  const sets = Array.isArray(raw.sets)
    ? raw.sets
    : Object.values(raw.sets ?? {});

  return { photos, sets };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
