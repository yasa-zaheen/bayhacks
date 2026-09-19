# Poseidon — Circular Capture Coach

American Circular track entry for Bay Hacks. Next.js web app that coaches device photography, evaluates capture quality, and issues a Digital Product Passport.

## What it does

Evaluates a group of device photos for the three required views (`front`, `rear_ports`, `label`):

- blur, underexposure, glare/overexposure, framing, DEMO-label obstruction
- `usable` / `retake` / `needs_review`
- Missing views are reported separately from retakes
- Live webcam demo with a scripted voice coach and MediaPipe alignment guides
- Upload or run American Circular practice sets SET-001 … SET-009

The live camera path is a controlled demo: the same voice lines play every time and the passport is canned. Upload and practice-set evaluation use the OpenCV backend.

## Run the API (required for upload / practice sets)

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Run the web app

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). The app talks to `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

## Demo voice MP3s

Generate clips in ElevenLabs and drop them in `public/audio/poseidon-demo/` using the exact filenames in [`public/audio/poseidon-demo/README.txt`](public/audio/poseidon-demo/README.txt). The Live Camera tab plays them in order — same script every demo.

## Models / services

- OpenCV (local, via FastAPI)
- MediaPipe Object Detector (`@mediapipe/tasks-vision`) for live AR guides
- Pre-rendered MP3 clips in `public/audio/poseidon-demo/` (see README there; no ElevenLabs API at runtime)
- No paid GPU. No custom trained weights. No ACS production data.

## Known limitations

- Live demo QC is scripted, not live OpenCV
- Exterior ports and DEMO tape, not internal PCB chips
- Device identity is a class guess (tower / SFF / monitor / appliance / optical player)
