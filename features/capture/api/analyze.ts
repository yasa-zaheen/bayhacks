import type { PracticeCatalog, SetResult } from "../types";

export function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
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

export async function analyzePracticeSet(setId: string): Promise<SetResult> {
  const res = await fetch(`${apiUrl()}/analyze/practice-set/${setId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error((await res.text()) || "Practice set failed");
  }
  return res.json();
}
