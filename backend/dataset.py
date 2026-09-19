from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dataset"
IMAGES = ROOT / "images"


@lru_cache(maxsize=1)
def manifest() -> list[dict]:
    with open(ROOT / "manifest.csv", newline="") as f:
        return list(csv.DictReader(f))


@lru_cache(maxsize=1)
def photo_sets() -> list[dict]:
    with open(ROOT / "photo_sets.csv", newline="") as f:
        return list(csv.DictReader(f))


@lru_cache(maxsize=1)
def practice_labels() -> dict[str, dict]:
    with open(ROOT / "practice_labels.csv", newline="") as f:
        return {r["image_id"]: r for r in csv.DictReader(f)}


@lru_cache(maxsize=1)
def practice_set_labels() -> dict[str, dict]:
    with open(ROOT / "practice_set_labels.csv", newline="") as f:
        return {r["set_id"]: r for r in csv.DictReader(f)}


def image_path(image_id: str) -> Path:
    jpg = IMAGES / f"{image_id}.jpg"
    png = IMAGES / f"{image_id}.png"
    if jpg.exists():
        return jpg
    if png.exists():
        return png
    raise FileNotFoundError(image_id)


def catalog() -> dict:
    by_device: dict[str, list] = {}
    for row in manifest():
        by_device.setdefault(row["device_id"], []).append(
            {
                "image_id": row["image_id"],
                "path": f"/practice/image/{row['image_id']}",
            }
        )
    sets = []
    grouped: dict[str, list] = {}
    for row in photo_sets():
        grouped.setdefault(row["set_id"], []).append(row)
    labels = practice_set_labels()
    for sid, rows in grouped.items():
        sets.append(
            {
                "set_id": sid,
                "device_id": rows[0]["device_id"],
                "photos": [
                    {"image_id": r["image_id"], "intended_view": r["intended_view"]}
                    for r in rows
                ],
                "missing_views": [
                    v for v in (labels.get(sid, {}).get("missing_views") or "").split(";") if v
                ],
            }
        )
    return {"devices": by_device, "sets": sets}
