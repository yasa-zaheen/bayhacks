import type { PhotoResult, PracticeCatalog, SetResult } from "../types";

const PROXY_PATH = "/aperturegrade-api";

/** Same-origin proxy in dev (phone-safe with HTTPS). Override with NEXT_PUBLIC_API_URL in prod. */
export function apiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${PROXY_PATH}`;
  }
  return "http://127.0.0.1:8000";
}

export function practiceImageUrl(imageId: string) {
  return `${apiUrl()}/practice/image/${imageId}`;
}

export async function fetchCatalog(): Promise<PracticeCatalog> {
  const res = await fetch(`${apiUrl()}/practice/catalog`);
  if (!res.ok) {
    throw new Error("Could not load practice catalog. Is the API running?");
  }
  return res.json();
}

export async function analyzeSet(
  items: { file: Blob; intended_view: string; name?: string }[]
): Promise<SetResult> {
  const fd = new FormData();
  fd.append("intended_views", items.map((item) => item.intended_view).join(","));
  items.forEach((item, index) => {
    fd.append("files", item.file, item.name ?? `shot-${index}.jpg`);
  });
  const res = await fetch(`${apiUrl()}/analyze/set`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    throw new Error((await res.text()) || "Analyze set failed");
  }
  return res.json();
}

export async function analyzePracticeImage(
  imageId: string,
  intendedView: string
): Promise<PhotoResult> {
  const res = await fetch(practiceImageUrl(imageId));
  if (!res.ok) {
    throw new Error(`Could not load ${imageId}. Is the API running?`);
  }
  const blob = await res.blob();
  const fd = new FormData();
  fd.append("file", blob, `${imageId}.jpg`);
  fd.append("intended_view", intendedView);
  fd.append("photo_id", imageId);
  const analyzeRes = await fetch(`${apiUrl()}/analyze/photo`, {
    method: "POST",
    body: fd,
  });
  if (!analyzeRes.ok) {
    throw new Error((await analyzeRes.text()) || "Photo analysis failed");
  }
  return analyzeRes.json();
}

export async function analyzePracticeSet(setId: string): Promise<SetResult> {
  const res = await fetch(`${apiUrl()}/analyze/practice-set/${setId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error((await res.text()) || "Practice set failed");
  }
  return res.json();
}
