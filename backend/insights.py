from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from typing import Optional
from uuid import uuid4

from qc import REQUIRED_VIEWS, PhotoResult

DEVICE_META = {
    "desktop_tower": {
        "title": "Desktop tower",
        "route_value": 85,
        "co2_kg": 14.2,
        "materials": {"steel": 42, "aluminum": 8, "copper": 12, "plastics": 28, "precious": 10},
    },
    "desktop_sff": {
        "title": "Small-form-factor PC",
        "route_value": 70,
        "co2_kg": 9.8,
        "materials": {"steel": 38, "copper": 14, "plastics": 32, "precious": 16},
    },
    "monitor": {
        "title": "LCD monitor",
        "route_value": 45,
        "co2_kg": 18.6,
        "materials": {"glass": 30, "plastics": 40, "aluminum": 12, "copper": 10, "other": 8},
    },
    "network_appliance": {
        "title": "Network / IoT appliance",
        "route_value": 35,
        "co2_kg": 4.1,
        "materials": {"plastics": 45, "pcb": 30, "copper": 15, "aluminum": 10},
    },
    "optical_player": {
        "title": "Optical media player",
        "route_value": 22,
        "co2_kg": 6.4,
        "materials": {"steel": 35, "plastics": 40, "copper": 15, "pcb": 10},
    },
    "electronics": {
        "title": "Electronic device",
        "route_value": 30,
        "co2_kg": 5.0,
        "materials": {"mixed": 100},
    },
}

PLAYBOOKS = {
    "desktop_tower": [
        {"step": 1, "title": "Release the side panel", "body": "Press the rear latch and slide the left panel off. No tools for most OptiPlex towers."},
        {"step": 2, "title": "Harvest DIMMs", "body": "Open the white retention clips on each RAM slot and pull modules straight out. Bag and label."},
        {"step": 3, "title": "Remove drives", "body": "Slide the optical bay and 3.5\" caddy out. Keep screws with the chassis."},
        {"step": 4, "title": "PSU last", "body": "Unplug 24-pin and CPU power, remove four rear screws, lift the PSU. Route to metal recovery if dead."},
    ],
    "desktop_sff": [
        {"step": 1, "title": "Pull the top cover", "body": "Release the rear catch and lift the lid. SFF OptiPlex units are tool-less."},
        {"step": 2, "title": "Riser and drives", "body": "Remove the optical drive, then the hard-drive caddy. Note cable routing for reassembly."},
        {"step": 3, "title": "Memory and WLAN", "body": "Extract SODIMMs and any half-height cards before the motherboard."},
    ],
    "monitor": [
        {"step": 1, "title": "Stand first", "body": "Depress the VESA release and remove the stand and base. Recycle the metal column separately."},
        {"step": 2, "title": "Bezel clips", "body": "Work a plastic spudger around the rear bezel. Avoid puncturing the panel."},
        {"step": 3, "title": "Boards and CCFL/LED strip", "body": "Photograph the board layout, then lift the power and T-con boards. Panel glass is hazardous waste."},
    ],
    "network_appliance": [
        {"step": 1, "title": "Four case screws", "body": "Remove bottom or rear screws and split the clamshell."},
        {"step": 2, "title": "Single PCB harvest", "body": "Disconnect the DC jack and lift the board. High CRM density relative to size."},
    ],
    "optical_player": [
        {"step": 1, "title": "Top cover", "body": "Remove perimeter screws and lift the lid. Watch the ribbon to the display."},
        {"step": 2, "title": "Laser sled and PSU", "body": "The sled contains copper coils and rare-earth magnets; bag separately from the chassis."},
    ],
    "electronics": [
        {"step": 1, "title": "Document fasteners", "body": "Photograph every screw location before removal."},
        {"step": 2, "title": "Separate batteries", "body": "If a cell is present, isolate it before any further harvest."},
    ],
}


def majority_class(results: list[PhotoResult]) -> str:
    counts: dict[str, int] = {}
    for r in results:
        if r.device_class:
            counts[r.device_class] = counts.get(r.device_class, 0) + 1
    if not counts:
        return "electronics"
    return max(counts, key=counts.get)


def condition_grade(photos: list[dict], missing: list[str], fraud_risk: str) -> dict:
    statuses = [p["status"] for p in photos]
    usable = statuses.count("usable")
    retake = statuses.count("retake")
    review = statuses.count("needs_review")
    if fraud_risk == "high" or missing:
        letter = "D"
    elif retake == 0 and review == 0 and usable == len(photos) and photos:
        letter = "A"
    elif retake == 0 and review <= 1:
        letter = "B"
    elif retake <= 2:
        letter = "C"
    else:
        letter = "D"
    photo_score = int(100 * usable / max(len(photos), 1))
    return {
        "letter": letter,
        "label": {
            "A": "Excellent — list-ready",
            "B": "Good — minor review",
            "C": "Fair — retakes required",
            "D": "Poor — incomplete or flagged",
        }[letter],
        "photo_score": photo_score,
        "subscores": {
            "photo_quality": photo_score,
            "completeness": 100 if not missing else int(100 * (3 - len(missing)) / 3),
            "integrity": 40 if fraud_risk == "high" else 75 if fraud_risk == "medium" else 100,
        },
    }


def route_device(device_class: str, grade: dict, missing: list[str], fraud_risk: str) -> dict:
    meta = DEVICE_META.get(device_class, DEVICE_META["electronics"])
    letter = grade["letter"]
    if fraud_risk == "high":
        code, why = "review", "Fraud flags require a human before any resale path."
    elif missing:
        code, why = "review", "Required views are missing — do not ship until the set is complete."
    elif letter in ("A", "B"):
        code, why = "refurb", "Complete usable set and solid cosmetic grade — send to refurb / resale."
    elif letter == "C":
        code, why = "harvest", "Working photos exist but quality is uneven — harvest high-value parts."
    else:
        code, why = "recycle", "Low confidence set — R2-certified recycling."
    return {
        "code": code,
        "title": {"refurb": "Refurbish", "harvest": "Harvest parts", "recycle": "Recycle", "review": "Hold for review"}[code],
        "reason": why,
        "est_value_usd": meta["route_value"] if code in ("refurb", "harvest") else int(meta["route_value"] * 0.15),
        "co2_kg_saved": meta["co2_kg"],
        "materials": meta["materials"],
    }


def fraud_report(photos: list[dict], results: list[PhotoResult]) -> dict:
    flags = []
    for p, r in zip(photos, results):
        for f in r.fraud_flags:
            flags.append({"photo_id": p.get("photo_id"), "code": f, "detail": r.reason})
        if r.view_mismatch:
            flags.append(
                {
                    "photo_id": p.get("photo_id"),
                    "code": "view_mismatch",
                    "detail": f"Intended {p.get('intended_view')} but content looks like {r.observed_view}.",
                }
            )
    demos = [r.demo_id for r in results if r.demo_id]
    risk = "low"
    if any(f["code"] == "label_tamper" for f in flags):
        risk = "medium"
    if any(f["code"] == "view_mismatch" for f in flags) or len(flags) >= 2:
        risk = "high" if any(f["code"] == "view_mismatch" for f in flags) else "medium"
    return {"risk": risk, "flags": flags, "demo_signals": demos}


def build_passport(
    photos: list[dict],
    results: list[PhotoResult],
    missing: list[str],
    set_id: Optional[str] = None,
) -> dict:
    device_class = majority_class(results)
    fraud = fraud_report(photos, results)
    grade = condition_grade(photos, missing, fraud["risk"])
    routing = route_device(device_class, grade, missing, fraud["risk"])
    pid = f"DPP-{uuid4().hex[:10].upper()}"
    components = []
    seen = set()
    for r in results:
        for c in r.components:
            key = c["id"]
            if key not in seen:
                seen.add(key)
                components.append(c)
    body = {
        "passport_id": pid,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "set_id": set_id,
        "device_class": device_class,
        "device_title": DEVICE_META.get(device_class, DEVICE_META["electronics"])["title"],
        "condition_grade": grade,
        "route": routing,
        "components": components,
        "missing_views": missing,
        "fraud": fraud,
        "photos": [
            {
                "photo_id": p.get("photo_id"),
                "intended_view": p.get("intended_view"),
                "status": r.status,
                "issue_codes": r.issue_codes,
                "sha256": p.get("sha256"),
            }
            for p, r in zip(photos, results)
        ],
        "playbook": PLAYBOOKS.get(device_class, PLAYBOOKS["electronics"]),
    }
    body["integrity_hash"] = sha256(pid.encode()).hexdigest()[:16]
    return body


def set_missing_views(intended: list[str]) -> list[str]:
    present = set(intended)
    return [v for v in REQUIRED_VIEWS if v not in present]
