ApertureGrade live demo voice clips
================================

Pre-generate these in ElevenLabs (same voice + settings for every clip), export as MP3,
and place in this folder.

The Live Camera tab plays them in order during Start session. No in-app TTS and no
ElevenLabs API at runtime — local MP3s only.

Current filenames (mapped in features/capture/utils/demoAudio.ts):
  welcome.mp3
  step 1.mp3
  hold steady.mp3          (front + rear steady cues reuse this clip)
  nice picture.mp3
  back.mp3
  capture the rear.mp3
  demo label.mp3
  hold close.mp3
  all photos captured.mp3

If a file is missing, the app logs a warning in dev and continues so you can test
the camera flow before all clips are ready.

Suggested ElevenLabs settings (match your Cognifit demo):
- Voice: pick one voice and use it for all 10 clips
- Stability / similarity: keep consistent across files
- Export: MP3

Playback order during demo
--------------------------
01 welcome → 02 front → 03 front steady → 04 front ready → [user captures front]
→ 05 rear → 06 rear steady → 07 rear ready → [user captures rear]
→ 08 label → 09 label ready → [user captures label]
→ 10 finish → passport dialog opens

Filenames and scripts (paste each block into ElevenLabs)
------------------------------------------------------

Filename: 01-welcome.mp3
Welcome to ApertureGrade. Let's start by taking some pictures.

Filename: 02-front-instructions.mp3
Step one — front. Include the outer edges of the device.

Filename: 03-front-hold-steady.mp3
Hold steady… stop shaking for a moment.

Filename: 04-front-capture-ready.mp3
That's a nice picture. Tap capture when you're ready.

Filename: 05-rear-instructions.mp3
Now move to the back. Show the ports and connectors.

Filename: 06-rear-hold-steady.mp3
Hold steady… good.

Filename: 07-rear-capture-ready.mp3
Looks aligned. Capture the rear now.

Filename: 08-label-instructions.mp3
Last — the DEMO label. Get the orange tape in frame.

Filename: 09-label-capture-ready.mp3
Hold close and tap capture.

Filename: 10-finish-passport.mp3
All photos captured. Here's your digital passport.
