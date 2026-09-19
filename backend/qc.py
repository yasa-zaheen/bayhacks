"""Deterministic capture-quality checks for Circular Capture Coach.

Issue codes match PHOTO_GUIDE.md:
  blur, underexposed, glare_or_overexposed, framing, label_obstructed
Statuses: usable | retake | needs_review
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

GUIDANCE = {
    "blur": "Hold the camera steady and refocus on the subject.",
    "underexposed": "Add even lighting and retake without deep shadows.",
    "glare_or_overexposed": "Move the light or change the camera angle to reduce glare.",
    "framing": "Reposition to include the complete required subject.",
    "label_obstructed": "Uncover the DEMO label and retake so every character is visible.",
}

REASONS = {
    "blur": "Focus or motion blur obscures relevant detail.",
    "underexposed": "The required subject is too dark to inspect reliably.",
    "glare_or_overexposed": "Excessive brightness or glare reduces visible subject detail.",
    "framing": "Part of the intended subject or label lies outside the frame.",
    "label_obstructed": "Tape covers part of the temporary DEMO label.",
}

REQUIRED_VIEWS = ("front", "rear_ports", "label")


@dataclass
class PhotoResult:
    status: str
    issue_codes: list[str]
    reason: str
    retake_guidance: str
    observed_view: str
    confidence: float
    metrics: dict
    components: list[dict] = field(default_factory=list)
    demo_id: Optional[str] = None
    device_class: Optional[str] = None
    view_mismatch: bool = False
    fraud_flags: list[str] = field(default_factory=list)
    condition_hints: dict = field(default_factory=dict)


def _bgr(image: np.ndarray) -> np.ndarray:
    if image.ndim == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    return image


def _privacy_mask(gray: np.ndarray) -> np.ndarray:
    """Large rectangular black privacy boxes only — not dark device surfaces."""
    dark = (gray < 12).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
    min_area = gray.size * 0.004
    out = np.zeros_like(dark)
    for i in range(1, n):
        x, y, w, h, a = (int(stats[i, j]) for j in range(5))
        if a < min_area:
            continue
        # boxes are axis-aligned rectangles
        rect = a / max(w * h, 1)
        if rect > 0.7:
            out[lab == i] = 1
    return out.astype(bool)


def red_mask(bgr: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (0, 70, 70), (20, 255, 255)) | cv2.inRange(
        hsv, (160, 70, 70), (180, 255, 255)
    )
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
    return m


def device_mask(gray: np.ndarray) -> np.ndarray:
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    fg = (255 - th) if gray.mean() > 100 else th
    fg = cv2.bitwise_and(fg, ((gray < 195).astype(np.uint8) * 255))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n <= 1:
        return fg
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return (lab == i).astype(np.uint8) * 255


def _largest_red_stats(rm: np.ndarray) -> Optional[dict]:
    n, lab, stats, _ = cv2.connectedComponentsWithStats((rm > 0).astype(np.uint8), 8)
    comps = []
    for i in range(1, n):
        a = int(stats[i, cv2.CC_STAT_AREA])
        if a < 200:
            continue
        x, y, w, h = (int(stats[i, j]) for j in range(4))
        comps.append({"area": a, "x": x, "y": y, "w": w, "h": h, "i": i})
    if not comps:
        return None
    comps.sort(key=lambda c: c["area"], reverse=True)
    main = comps[0]
    crop = (lab == main["i"]).astype(np.uint8) * 255
    crop = crop[main["y"] : main["y"] + main["h"], main["x"] : main["x"] + main["w"]]
    rect = main["area"] / max(main["w"] * main["h"], 1)
    cnts, _ = cv2.findContours(crop, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    solidity = 0.0
    defects = 0
    if cnts:
        c = max(cnts, key=cv2.contourArea)
        hull = cv2.convexHull(c)
        ha = cv2.contourArea(hull)
        solidity = float(cv2.contourArea(c) / max(ha, 1))
        if len(c) >= 4:
            try:
                hull_ix = cv2.convexHull(c, returnPoints=False)
                d = cv2.convexityDefects(c, hull_ix)
                if d is not None:
                    defects = int((d[:, :, 3] > 2000).sum())
            except cv2.error:
                defects = 0
    second = comps[1]["area"] / main["area"] if len(comps) > 1 else 0.0
    return {
        "main": main,
        "n": len(comps),
        "second_ratio": second,
        "rectangularity": float(rect),
        "solidity": solidity,
        "defects": defects,
        "comps": comps,
        "lab": lab,
    }


def _border_contact(mask: np.ndarray, band: int = 4) -> dict:
    m = mask > 0
    if m.size == 0:
        return {"top": 0, "bottom": 0, "left": 0, "right": 0, "max": 0}
    top = float(m[:band, :].mean())
    bottom = float(m[-band:, :].mean())
    left = float(m[:, :band].mean())
    right = float(m[:, -band:].mean())
    return {
        "top": top,
        "bottom": bottom,
        "left": left,
        "right": right,
        "max": max(top, bottom, left, right),
    }


def _port_score(bgr: np.ndarray, gray: np.ndarray) -> float:
    """Higher = more likely a rear I/O panel (dense small dark holes / jacks)."""
    h, w = gray.shape
    roi = gray[int(h * 0.15) : int(h * 0.9), int(w * 0.15) : int(w * 0.9)]
    if roi.size == 0:
        return 0.0
    blur = cv2.GaussianBlur(roi, (5, 5), 0)
    edges = cv2.Canny(blur, 40, 120)
    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    small = 0
    for c in cnts:
        x, y, cw, ch = cv2.boundingRect(c)
        area = cw * ch
        if 80 < area < 8000 and 0.25 < cw / max(ch, 1) < 4:
            small += 1
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    color_ports = 0
    for lo, hi in [
        ((80, 40, 40), (140, 255, 255)),  # teal/blue jacks
        ((140, 40, 40), (170, 255, 255)),  # magenta parallel
        ((35, 40, 40), (85, 255, 255)),  # green audio/ps2
    ]:
        color_ports += int(cv2.inRange(hsv, lo, hi).mean() > 0.002)
    return float(min(1.0, small / 40.0 + 0.15 * color_ports))


def classify_device(bgr: np.ndarray, gray: np.ndarray, demo_id: Optional[str]) -> str:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    blue = cv2.inRange(hsv, (95, 80, 60), (130, 255, 255)).mean() / 255.0
    h, w = gray.shape
    dm = device_mask(gray)
    ys, xs = np.where(dm > 0)
    aspect = 1.0
    if len(xs) > 20:
        bw = xs.max() - xs.min()
        bh = ys.max() - ys.min()
        aspect = bw / max(bh, 1)
    if blue > 0.04:
        return "network_appliance"
    if aspect > 1.25 and _port_score(bgr, gray) < 0.25:
        # wide front-facing screen
        if dm.mean() / 255 < 0.4:
            return "monitor"
    if aspect < 0.7:
        return "desktop_sff"
    if aspect < 1.15:
        return "desktop_tower"
    if demo_id == "DEMO-008" or aspect > 1.4:
        return "optical_player"
    return "electronics"


def extract_demo_id(bgr: np.ndarray, rm: np.ndarray) -> Optional[str]:
    """Best-effort id from geometry; OCR on handwriting is unreliable so we
    also expose a coarse estimate from the intended practice labels is not used.
    We look for high-contrast ink strokes on the DEMO tape."""
    stats = _largest_red_stats(rm)
    if not stats:
        return None
    m = stats["main"]
    crop = bgr[m["y"] : m["y"] + m["h"], m["x"] : m["x"] + m["w"]]
    if crop.size == 0:
        return None
    # Not claiming a verified serial — only a DEMO tag presence flag.
    ink = (crop.mean(axis=2) < 70).mean()
    if ink > 0.01:
        return "DEMO-present"
    return None


def analyze_image(image: np.ndarray, intended_view: str) -> PhotoResult:
    bgr = _bgr(image)
    h0, w0 = bgr.shape[:2]
    # Downscale only huge images so Laplacian stays comparable to the practice set.
    if max(h0, w0) > 1600:
        scale = 1600 / max(h0, w0)
        bgr = cv2.resize(bgr, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA)
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    priv = _privacy_mask(gray)
    work = gray.copy()
    work[priv] = int(np.median(gray[~priv])) if (~priv).any() else 128

    y0, y1 = int(h * 0.15), int(h * 0.85)
    x0, x1 = int(w * 0.15), int(w * 0.85)
    center = work[y0:y1, x0:x1]
    lap_c = float(cv2.Laplacian(center, cv2.CV_64F).var())
    mean_c = float(center.mean())
    p5 = float(np.percentile(work, 5))
    p95 = float(np.percentile(work, 95))
    hi = float((work > 240).mean())

    rm = red_mask(bgr)
    red_ratio = float((rm > 0).mean())
    red_stats = _largest_red_stats(rm)
    red_border = _border_contact(rm, band=12)

    dm = device_mask(work)
    dev_border = _border_contact(dm, band=4)
    port = _port_score(bgr, work)

    issues: list[str] = []
    review = False
    view_mismatch = False
    observed = intended_view
    fraud: list[str] = []

    # 1. Exposure
    underexposed = mean_c < 48 or p95 < 85
    if underexposed:
        issues.append("underexposed")

    # 2. Glare / overexposure
    if hi > 0.70 or (hi > 0.40 and lap_c < 25):
        issues.append("glare_or_overexposed")
    elif hi > 0.45 and mean_c > 170:
        review = True

    # 3. Framing
    if "underexposed" not in issues:
        if intended_view == "label":
            if red_border["max"] > 0.05:
                issues.append("framing")
        else:
            side_cut = max(dev_border["left"], dev_border["right"])
            if intended_view == "rear_ports" and side_cut > 0.15:
                review = True
            elif side_cut > 0.28:
                issues.append("framing")

    # 4. Blur — skip when darkness, glare, or a cut-off frame already explain the shot
    if (
        "underexposed" not in issues
        and "glare_or_overexposed" not in issues
        and "framing" not in issues
        and not review
    ):
        blur_cut = 100 if intended_view == "label" else 90
        if lap_c < blur_cut:
            issues.append("blur")

    # 5. Label obstruction (only when we can see the tape)
    if (
        intended_view == "label"
        and "underexposed" not in issues
        and "blur" not in issues
        and "glare_or_overexposed" not in issues
        and "framing" not in issues
        and red_stats
    ):
        obstructed = (
            red_stats["solidity"] < 0.92 and red_stats["rectangularity"] < 0.80
        ) or red_stats["second_ratio"] > 0.28
        if obstructed:
            issues.append("label_obstructed")
            fraud.append("label_tamper")

    # View mismatch
    if intended_view == "label" and red_ratio < 0.004 and "underexposed" not in issues:
        view_mismatch = True
        review = True
        observed = "uncertain"
        fraud.append("view_mismatch")
    if intended_view == "rear_ports" and port < 0.18 and "underexposed" not in issues:
        if not review:
            review = True
        observed = "uncertain"

    demo_id = extract_demo_id(bgr, rm)
    device_class = classify_device(bgr, work, demo_id)

    components = _detect_components(bgr, work, intended_view, rm, red_stats, port)

    if issues:
        status = "retake"
    elif review:
        status = "needs_review"
    else:
        status = "usable"

    if status == "usable":
        reason = "Required detail is sufficiently visible for this intended view."
        guidance = ""
    elif status == "needs_review":
        if hi > 0.45:
            reason = "Brightness is elevated, but whether the required detail is unusable is ambiguous."
        elif intended_view == "rear_ports":
            reason = "The intended connection area is not clearly shown."
        elif view_mismatch:
            reason = "Selected view does not match the visible content."
        else:
            reason = "Could not reliably decide; a human should review this shot."
        guidance = "Ask a human to review the intended view and visible detail."
    else:
        reason = " ".join(REASONS[c] for c in issues)
        guidance = " ".join(GUIDANCE[c] for c in issues)

    confidence = 0.92 if status == "retake" else 0.8 if status == "usable" else 0.55

    metrics = {
        "laplacian": round(lap_c, 1),
        "mean_luma": round(mean_c, 1),
        "highlight_ratio": round(hi, 3),
        "p5": round(p5, 1),
        "p95": round(p95, 1),
        "red_ratio": round(red_ratio, 3),
        "device_border": {k: round(v, 3) for k, v in dev_border.items()},
        "red_border": {k: round(v, 3) for k, v in red_border.items()},
        "port_score": round(port, 3),
        "label_rectangularity": round(red_stats["rectangularity"], 3) if red_stats else None,
        "label_solidity": round(red_stats["solidity"], 3) if red_stats else None,
        "width": w0,
        "height": h0,
    }

    scratches = float(cv2.Canny(work, 80, 180).mean() / 255.0)
    condition_hints = {
        "scratch_density": round(scratches, 4),
        "dust_highlights": round(float((work > 230).mean()), 4),
    }

    return PhotoResult(
        status=status,
        issue_codes=issues,
        reason=reason,
        retake_guidance=guidance,
        observed_view=observed,
        confidence=confidence,
        metrics=metrics,
        components=components,
        demo_id=demo_id,
        device_class=device_class,
        view_mismatch=view_mismatch,
        fraud_flags=fraud,
        condition_hints=condition_hints,
    )


def _detect_components(
    bgr: np.ndarray,
    gray: np.ndarray,
    intended_view: str,
    rm: np.ndarray,
    red_stats: Optional[dict],
    port: float,
) -> list[dict]:
    h, w = gray.shape
    out: list[dict] = []
    if red_stats:
        m = red_stats["main"]
        out.append(
            {
                "id": "demo_label",
                "label": "DEMO challenge label",
                "confidence": 0.9,
                "bbox": [
                    round(m["x"] / w, 3),
                    round(m["y"] / h, 3),
                    round(m["w"] / w, 3),
                    round(m["h"] / h, 3),
                ],
            }
        )
    if intended_view == "rear_ports" or port > 0.3:
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        catalog = [
            ("audio_jack", (0, 40, 80), (20, 255, 255), "Audio jack"),
            ("usb_or_video", (90, 20, 20), (140, 80, 80), "I/O cluster"),
        ]
        # Approximate I/O panel as the densest edge region
        edges = cv2.Canny(gray, 50, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
        heat = cv2.blur(edges, (35, 35))
        _, loc, _, maxloc = cv2.minMaxLoc(heat)
        mx, my = maxloc
        out.append(
            {
                "id": "io_panel",
                "label": "Rear I/O / connectors",
                "confidence": round(min(0.95, 0.4 + port), 2),
                "bbox": [
                    round(max(mx / w - 0.18, 0), 3),
                    round(max(my / h - 0.18, 0), 3),
                    0.36,
                    0.36,
                ],
            }
        )
        _ = catalog, hsv
    if intended_view == "front":
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        blue_badge = cv2.inRange(hsv, (95, 80, 80), (130, 255, 255))
        n, _, stats, _ = cv2.connectedComponentsWithStats(blue_badge, 8)
        for i in range(1, n):
            a = stats[i, cv2.CC_STAT_AREA]
            if 80 < a < 8000:
                x, y, bw, bh = (int(stats[i, j]) for j in range(4))
                out.append(
                    {
                        "id": "badge",
                        "label": "Brand / CPU badge",
                        "confidence": 0.7,
                        "bbox": [
                            round(x / w, 3),
                            round(y / h, 3),
                            round(bw / w, 3),
                            round(bh / h, 3),
                        ],
                    }
                )
                break
        # optical drive: long horizontal dark slot
        edges = cv2.Canny(gray, 40, 120)
        cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            x, y, cw, ch = cv2.boundingRect(c)
            if cw > w * 0.25 and 8 < ch < h * 0.08 and cw / max(ch, 1) > 4:
                out.append(
                    {
                        "id": "optical_drive",
                        "label": "Optical / media bay",
                        "confidence": 0.65,
                        "bbox": [
                            round(x / w, 3),
                            round(y / h, 3),
                            round(cw / w, 3),
                            round(ch / h, 3),
                        ],
                    }
                )
                break
    return out


def _device_contour(gray: np.ndarray) -> tuple[list[list[float]], list[float]]:
    """Return (contour_points, bbox) normalised 0-1 for the largest foreground object."""
    dm = device_mask(gray)
    h, w = gray.shape
    cnts, _ = cv2.findContours(dm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return [], []
    c = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(c) < gray.size * 0.01:
        return [], []
    eps = 0.008 * cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, eps, True)
    pts = [[round(float(p[0][0]) / w, 4), round(float(p[0][1]) / h, 4)] for p in approx]
    x, y, bw, bh = cv2.boundingRect(c)
    bbox = [round(x / w, 4), round(y / h, 4), round(bw / w, 4), round(bh / h, 4)]
    return pts, bbox


def _glare_regions(gray: np.ndarray, threshold: int = 235) -> list[list[float]]:
    """Return normalised bboxes for bright glare hotspots."""
    h, w = gray.shape
    mask = (gray > threshold).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    out = []
    min_area = gray.size * 0.003
    for i in range(1, n):
        a = int(stats[i, cv2.CC_STAT_AREA])
        if a < min_area:
            continue
        x, y, bw, bh = (int(stats[i, j]) for j in range(4))
        out.append([round(x / w, 4), round(y / h, 4), round(bw / w, 4), round(bh / h, 4)])
    return out[:5]


def live_scores(image: np.ndarray, intended_view: str) -> dict:
    """Scores + AR geometry for the camera overlay."""
    bgr = _bgr(image)
    h0, w0 = bgr.shape[:2]
    if max(h0, w0) > 1600:
        scale = 1600 / max(h0, w0)
        bgr = cv2.resize(bgr, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    r = analyze_image(image, intended_view)
    ready = r.status == "usable"

    contour_pts, device_bbox = _device_contour(gray)
    glare_spots = _glare_regions(gray)

    return {
        "ready": ready,
        "status": r.status,
        "issue_codes": r.issue_codes,
        "guidance": r.retake_guidance or "Looks good — capture this shot.",
        "metrics": {
            "sharpness": min(1.0, r.metrics["laplacian"] / 250.0),
            "exposure": min(1.0, r.metrics["mean_luma"] / 140.0),
            "glare": r.metrics["highlight_ratio"],
            "framing_ok": "framing" not in r.issue_codes,
            "label_ok": "label_obstructed" not in r.issue_codes,
        },
        "observed_view": r.observed_view,
        "ar": {
            "device_contour": contour_pts,
            "device_bbox": device_bbox,
            "components": r.components,
            "glare_spots": glare_spots,
        },
    }
