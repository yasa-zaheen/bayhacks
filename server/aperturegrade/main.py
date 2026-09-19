from __future__ import annotations

import os
from hashlib import sha256
from uuid import uuid4

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from dataset import catalog, image_path, practice_labels, practice_set_labels
from insights import build_passport, set_missing_views
from qc import analyze_image, live_scores

STATIC = os.path.join(os.path.dirname(__file__), "static")

app = FastAPI(title="ApertureGrade — Circular Capture Coach", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.isdir(STATIC):
    app.mount("/assets", StaticFiles(directory=STATIC), name="assets")


def _decode(data: bytes) -> np.ndarray:
    if not data or len(data) < 100:
        raise HTTPException(400, "Empty or too-small image payload")
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Could not decode image — check file format")
    return img


def _photo_payload(result, photo_id: str, intended_view: str, digest: str | None = None) -> dict:
    return {
        "photo_id": photo_id,
        "intended_view": intended_view,
        "status": result.status,
        "issue_codes": result.issue_codes,
        "reason": result.reason,
        "retake_guidance": result.retake_guidance,
        "observed_view": result.observed_view,
        "confidence": result.confidence,
        "metrics": result.metrics,
        "components": result.components,
        "demo_id": result.demo_id,
        "device_class": result.device_class,
        "view_mismatch": result.view_mismatch,
        "fraud_flags": result.fraud_flags,
        "condition_hints": result.condition_hints,
        "sha256": digest,
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/practice/catalog")
def practice_catalog():
    return catalog()


@app.get("/practice/image/{image_id}")
def practice_image(image_id: str):
    try:
        path = image_path(image_id)
    except FileNotFoundError:
        raise HTTPException(404, "Unknown image")
    media = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return FileResponse(path, media_type=media)


@app.get("/practice/labels")
def labels():
    return {"photos": practice_labels(), "sets": practice_set_labels()}


def _form_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


@app.post("/analyze/photo")
async def analyze_photo(
    file: UploadFile = File(...),
    intended_view: str = Form("front"),
    photo_id: str = Form(""),
    live: str = Form("0"),
):
    data = await file.read()
    img = _decode(data)
    result = analyze_image(img, intended_view, live=_form_bool(live))
    pid = photo_id or f"P-{uuid4().hex[:8]}"
    digest = sha256(data).hexdigest()
    return _photo_payload(result, pid, intended_view, digest)


@app.post("/analyze/live")
async def analyze_live(
    file: UploadFile = File(...),
    intended_view: str = Form("front"),
):
    try:
        data = await file.read()
    except Exception:
        raise HTTPException(400, "Failed to read uploaded file")
    img = _decode(data)
    return live_scores(img, intended_view)


@app.post("/analyze/set")
async def analyze_set(
    files: list[UploadFile] = File(...),
    intended_views: str = Form(...),
    set_id: str = Form(""),
):
    views = [v.strip() for v in intended_views.split(",") if v.strip()]
    if len(views) != len(files):
        raise HTTPException(400, "intended_views count must match files")
    photos = []
    results = []
    for upload, view in zip(files, views):
        data = await upload.read()
        img = _decode(data)
        result = analyze_image(img, view)
        pid = f"P-{uuid4().hex[:8]}"
        payload = _photo_payload(result, pid, view, sha256(data).hexdigest())
        photos.append(payload)
        results.append(result)
    missing = set_missing_views(views)
    passport = build_passport(photos, results, missing, set_id or None)
    return {
        "set_id": set_id or f"SET-{uuid4().hex[:6].upper()}",
        "missing_views": missing,
        "missing_reason": (
            f"No image assigned for: {';'.join(missing)}"
            if missing
            else "All three intended views supplied; quality must still be assessed."
        ),
        "photos": photos,
        "passport": passport,
    }


@app.post("/analyze/practice-set/{set_id}")
def analyze_practice_set(set_id: str):
    cat = catalog()
    match = next((s for s in cat["sets"] if s["set_id"] == set_id), None)
    if not match:
        raise HTTPException(404, "Unknown set")
    photos = []
    results = []
    views = []
    for item in match["photos"]:
        path = image_path(item["image_id"])
        data = path.read_bytes()
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        view = item["intended_view"]
        result = analyze_image(img, view)
        payload = _photo_payload(result, item["image_id"], view, sha256(data).hexdigest())
        photos.append(payload)
        results.append(result)
        views.append(view)
    missing = set_missing_views(views)
    passport = build_passport(photos, results, missing, set_id)
    return {
        "set_id": set_id,
        "device_id": match["device_id"],
        "missing_views": missing,
        "missing_reason": (
            f"No image assigned for: {';'.join(missing)}"
            if missing
            else "All three intended views supplied; quality must still be assessed."
        ),
        "photos": photos,
        "passport": passport,
    }


@app.websocket("/ws/coach")
async def coach_socket(ws: WebSocket):
    await ws.accept()
    intended = "front"
    try:
        while True:
            message = await ws.receive()
            if message.get("text"):
                intended = message["text"].strip() or intended
                await ws.send_json({"ok": True, "intended_view": intended})
                continue
            data = message.get("bytes")
            if not data:
                continue
            img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                await ws.send_json({"error": "bad_frame"})
                continue
            await ws.send_json(live_scores(img, intended))
    except WebSocketDisconnect:
        return


ELEVEN_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")


@app.get("/voice/status")
def voice_status():
    return {"elevenlabs": bool(os.environ.get("ELEVENLABS_API_KEY"))}


@app.get("/voice/speak")
def voice_speak(text: str):
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise HTTPException(404, "ElevenLabs key not configured")
    import httpx

    r = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_VOICE}",
        headers={"xi-api-key": key, "Accept": "audio/mpeg"},
        json={
            "text": text[:500],
            "model_id": "eleven_v3",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.3},
        },
        timeout=25.0,
    )
    if r.status_code >= 400:
        raise HTTPException(502, r.text[:200])
    return Response(content=r.content, media_type="audio/mpeg")


@app.post("/voice/script")
def voice_script(payload: dict):
    status = payload.get("status", "usable")
    view = payload.get("intended_view", "front")
    names = {"front": "front", "rear_ports": "rear ports", "label": "DEMO label"}
    if status == "usable":
        text = f"{names.get(view, view)} captured. Looks usable."
    else:
        text = payload.get("retake_guidance") or "Please retake this photo."
    return {"text": text}


@app.get("/")
def index():
    return {"ok": True, "name": "ApertureGrade", "docs": "/docs"}
