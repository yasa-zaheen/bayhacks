# ApertureGrade — Circular Capture Coach

American Circular track entry. React Native (Expo) app plus a FastAPI vision backend.

The backend QC engine is validated against all 34 practice photos and all 9 photo sets.

## What it does

Evaluates a **group of device photos** for the three required views (`front`, `rear_ports`, `label`):

- blur, underexposure, glare/overexposure, framing, DEMO-label obstruction
- `usable` / `retake` / `needs_review`
- **Missing views are reported separately from retakes**
- Live camera coach (optional bonus) **and** upload / practice-set evaluation

Beyond the rubric: component callouts, Back Market-style condition grade, circular routing, digital product passport, fraud/view-mismatch flags, disassembly playbook, optional ElevenLabs voice.

## Run the API (required)

```bash
cd server/aperturegrade
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 for the judge web UI (live webcam **or** upload **or** practice sets).

## Run the Expo app

```bash
cd mobile
npm install
# Physical phone: set the machine LAN IP
# echo 'EXPO_PUBLIC_API_URL=http://192.168.x.x:8000' > .env
npx expo start
```

Home screen has three entry points:

1. **Live camera** — guided 3-shot session with real-time meters and haptic green light
2. **Upload photos** — pick from the library, tap to assign views, evaluate
3. **Practice library** — run SET-001 … SET-009 from this package

## How quality is decided

Deterministic OpenCV, not an LLM:

| Check | Method |
| --- | --- |
| blur | Laplacian variance on the subject region (after excluding privacy boxes) |
| underexposed | Center luminance / 95th percentile |
| glare_or_overexposed | Highlight ratio; ambiguous bright-but-readable shots go to `needs_review` |
| framing | Device mask touching left/right edge; DEMO tape touching the frame for label shots |
| label_obstructed | Orange-tape shape (solidity / rectangularity / extra blobs) |
| missing views | Set-level checklist vs `front`, `rear_ports`, `label` |

Black privacy boxes are ignored. Only the orange DEMO tape is scored for obstruction.

AI vs rules: port/badge/optical-bay callouts and device-class heuristics are CV; routing, grade, fraud, and playbooks are rule engines. `needs_review` is used when we cannot decide (IMG-0024, IMG-0025).

## Models / services

- OpenCV (local)
- Optional ElevenLabs TTS if `EXPO_PUBLIC_ELEVENLABS_API_KEY` is set in `mobile/.env`
- No paid GPU. No custom trained weights. No ACS production data.

## Known limitations

- Exterior ports and DEMO tape, not internal PCB chips
- Handwritten DEMO OCR is not treated as a verified serial
- Device identity is a class guess (tower / SFF / monitor / appliance / optical player)
- Live camera needs the API reachable from the phone (LAN IP, not `127.0.0.1`)
