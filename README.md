# ApertureGrade — Circular Capture Coach

American Circular track entry for Bay Hacks. Next.js web app that coaches device photography, evaluates capture quality, and issues a Digital Product Passport.

## What it does

Evaluates a group of device photos for the three required views (`front`, `rear_ports`, `label`):

- blur, underexposure, glare/overexposure, framing, DEMO-label obstruction
- `usable` / `retake` / `needs_review`
- Missing views are reported separately from retakes
- Live webcam demo with voice coach, real OpenCV QC, and MediaPipe alignment guides
- Upload or run American Circular practice sets SET-001 … SET-009

## Run everything (one command)

OpenCV analysis lives in `server/aperturegrade/` and is started automatically with the web app.

```bash
bun install
bun run analysis:install   # first time only — Python deps
bun dev                    # Next.js + analysis on port 8000 (internal)
```

Open [http://localhost:3000](http://localhost:3000). The browser calls `/aperturegrade-api/*`, which Next.js proxies to the analysis server on your laptop (`127.0.0.1:8000`). **Do not set `NEXT_PUBLIC_API_URL` for local or phone demos** — that bypasses the proxy and breaks on iPhone.

### Phone demo (Live Camera + real OpenCV QC)

Safari on iPhone **blocks many ports** (including `:8000`). Never open the analysis URL in the browser — only open the Next.js app URL. API traffic goes through `/aperturegrade-api/*` on the same host.

#### Recommended: ngrok (no restricted-port errors, HTTPS for camera)

```bash
bun run dev:tunnel
```

In another terminal ([install ngrok](https://ngrok.com/download) if needed):

```bash
ngrok http 3000
```

On your iPhone, open the **`https://….ngrok-free.app`** URL from ngrok (standard port 443 — Safari allows this).

#### Alternative: same Wi‑Fi + HTTPS on port 8080

Port **8080** is Safari-safe (avoid `:8000`, `:6000`, etc.).

```bash
bun run dev:https
```

On iPhone (same Wi‑Fi): `https://YOUR_MAC_IP:8080` (example `https://10.2.1.4:8080`). Tap through the certificate warning once.

**Also check:** Settings → Privacy & Security → **Local Network** → enable for Safari.

#### If you still see “restricted network port”

You are probably loading a **blocked port** directly. Use ngrok, or confirm the URL ends in **`:8080`** or **`.ngrok-free.app`** — not **`:8000`**.

#### If you see “Analysis offline” on phone

Your laptop is not running `bun dev`, or `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000` (remove it — `localhost` on the phone is the phone, not your Mac).

## Demo voice MP3s

Generate clips in ElevenLabs and drop them in `public/audio/aperturegrade-demo/` using the exact filenames in [`public/audio/aperturegrade-demo/README.txt`](public/audio/aperturegrade-demo/README.txt). The Live Camera tab plays them in order — same script every demo.

## Models / services

- OpenCV (local, `server/aperturegrade/` — proxied via Next.js)
- MediaPipe Object Detector (`@mediapipe/tasks-vision`) for live AR guides
- Pre-rendered MP3 clips in `public/audio/aperturegrade-demo/` (see README there; no ElevenLabs API at runtime)
- No paid GPU. No custom trained weights. No ACS production data.

## Known limitations

- Exterior ports and DEMO tape, not internal PCB chips
- Device identity is a class guess (tower / SFF / monitor / appliance / optical player)
