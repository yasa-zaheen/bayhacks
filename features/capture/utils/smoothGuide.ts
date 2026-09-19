import type { GuideBox } from "../types";

/** Exponential smoothing for normalized guide boxes. */
export function smoothGuideBox(
  previous: GuideBox | null,
  next: GuideBox,
  alpha = 0.16
): GuideBox {
  if (!previous) return clampGuideBox(next);
  const blend = (a: number, b: number) => a + (b - a) * alpha;
  return clampGuideBox({
    x: blend(previous.x, next.x),
    y: blend(previous.y, next.y),
    w: blend(previous.w, next.w),
    h: blend(previous.h, next.h),
  });
}

export function clampGuideBox(box: GuideBox): GuideBox {
  const w = Math.max(0.1, Math.min(0.9, box.w));
  const h = Math.max(0.1, Math.min(0.9, box.h));
  const x = Math.max(0, Math.min(1 - w, box.x));
  const y = Math.max(0, Math.min(1 - h, box.y));
  return { x, y, w, h };
}

/** Pull box edges inward for a tighter alignment frame. */
export function tightenGuideBox(box: GuideBox, inset = 0.06): GuideBox {
  const dx = box.w * inset;
  const dy = box.h * inset;
  return clampGuideBox({
    x: box.x + dx,
    y: box.y + dy,
    w: box.w - dx * 2,
    h: box.h - dy * 2,
  });
}

/** Hold the current label briefly so MediaPipe flicker does not swap text every frame. */
export function stabilizeLabel(
  current: string | null,
  incoming: string,
  sameCount: number,
  holdFrames = 5
): { label: string; sameCount: number } {
  if (!current) return { label: incoming, sameCount: 1 };
  if (incoming === current) return { label: current, sameCount: sameCount + 1 };
  if (sameCount < holdFrames) return { label: current, sameCount: sameCount + 1 };
  return { label: incoming, sameCount: 1 };
}
