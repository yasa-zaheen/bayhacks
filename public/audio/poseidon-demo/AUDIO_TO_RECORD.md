# Poseidon — ElevenLabs audio kit (scripted demo)

Export **MP3**, one voice, same settings for every clip.

**Save folder:** `public/audio/poseidon-demo/`

**App mode:** Live Camera → **Demo voice** → Start session

---

## Full manifest (16 files)

Record each line exactly (or very close). Filename must match.

| # | Save as | When it plays | Paste into ElevenLabs |
|---|---------|---------------|------------------------|
| 1 | `welcome.mp3` | Start | Welcome to Poseidon. We'll capture three photos — the front, the back, and the serial tag. |
| 2 | `step 1.mp3` | Front step | Step one — the front. Fill the frame with the device. |
| 3 | `hold steady.mp3` | After blur / between retakes | Hold steady… stop shaking for a moment. |
| 4 | `nice picture.mp3` | Front ready to capture | Good. Hold still — I'll capture when you're locked in. |
| 5 | `retake_blur.mp3` | Front fails — motion blur | That photo is blurry. Hold the camera steady and try again. |
| 6 | `perfect_front.mp3` | **Front accepted** | Perfect. That front shot passes quality checks. |
| 7 | `back.mp3` | Rear step | Step two — the back, where all the ports and details are. |
| 8 | `retake_dark.mp3` | **Rear too dark** | The contrast is too dark. Move it somewhere brighter, then try again. |
| 9 | `capture the rear.mp3` | Rear ready (after brightening) | Much better. Hold steady on the rear — capturing now. |
| 10 | `perfect_rear.mp3` | **Rear accepted** | Okay — now that's perfect. That's a perfect picture. |
| 11 | `serial_tag.mp3` | Serial step | Step three — the serial number or asset tag. |
| 12 | `retake_glare.mp3` | **Serial glare** | There's too much glare on the serial tag. Tilt the device or move the light. |
| 13 | `retake_framing.mp3` | Serial too close | You're too close. Step back so the full tag is in frame. |
| 14 | `hold close.mp3` | Label ready (after step back) | Good. Hold still — auto-capture when the tag is sharp. |
| 15 | `perfect_label.mp3` | **Serial accepted** | Okay — now that's perfect. That's a perfect picture. |
| 16 | `all photos captured.mp3` | Passport opens | All photos captured. Here's your digital passport. |

---

## Playback order (scripted demo)

```
welcome → step 1 → hold steady → nice picture
  → [capture] → retake_blur → hold steady → nice picture
  → [capture] → perfect_front

back → [capture] → retake_dark → hold steady → capture the rear
  → [capture] → perfect_rear

serial_tag → [capture] → retake_glare → hold steady → hold close
  → [capture] → retake_framing → hold steady → hold close
  → [capture] → perfect_label

all photos captured → passport
```

---

## Already on disk vs need recording

**You already have (may re-record if copy changed):**

- welcome.mp3, step 1.mp3, hold steady.mp3, nice picture.mp3
- retake_blur.mp3, back.mp3, capture the rear.mp3, hold close.mp3
- all photos captured.mp3, retake_framing.mp3

**Re-record recommended (script updated):**

- retake_dark.mp3 — rear “too dark” line
- retake_glare.mp3 — serial glare line

**New files required (4):**

- [ ] `perfect_front.mp3`
- [ ] `perfect_rear.mp3`
- [ ] `perfect_label.mp3`
- [ ] `serial_tag.mp3`

Optional legacy (not used): `demo label.mp3`, `retake_success.mp3`

---

## After dropping files

1. Hard refresh the app
2. Demo voice → Start session
3. Missing file → console `[Poseidon] Audio failed` (demo continues silently for that cue)

Scripts are also in `features/capture/utils/demoAudio.ts` → `POSEIDON_DEMO_SCRIPTS`.
