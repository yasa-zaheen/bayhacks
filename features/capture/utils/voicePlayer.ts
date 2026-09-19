/**
 * Local MP3 playback for the Poseidon live demo (same pattern as Cognifit / HackABullVII).
 * Pre-render in ElevenLabs, export MP3, place under public/audio/poseidon-demo/.
 */

let activeAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/** Call synchronously inside a user click so later clips can autoplay. */
export function primeAudioPlayback() {
  if (audioUnlocked || typeof window === "undefined") return;

  const audio = new Audio();
  audio.src =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
  void audio.play().then(
    () => {
      audio.pause();
      audioUnlocked = true;
    },
    () => {
      // Browser may still allow later play() after a real clip in the same gesture.
    }
  );
}

export function stopVoice() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio.src = "";
  } catch {
    // ignore
  }
  activeAudio = null;
}

/**
 * Plays one clip on a disposable Audio element. Resolves when playback ends or fails
 * so the demo flow never hangs waiting for a missing file.
 */
export function playMp3(src: string): Promise<void> {
  stopVoice();

  return new Promise((resolve) => {
    const audio = new Audio();
    activeAudio = audio;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      audio.removeEventListener("canplay", onCanPlay);
      if (activeAudio === audio) activeAudio = null;
      resolve();
    };

    const onEnd = () => finish();
    const onErr = (event?: Event) => {
      if (process.env.NODE_ENV === "development") {
        const mediaError = audio.error;
        console.warn(
          `[Poseidon] Audio failed: ${src}`,
          mediaError?.code ?? event?.type ?? "unknown"
        );
      }
      finish();
    };
    const onCanPlay = () => {
      void audio.play().catch(onErr);
    };

    audio.addEventListener("ended", onEnd, { once: true });
    audio.addEventListener("error", onErr, { once: true });
    audio.preload = "auto";
    audio.src = src;

    if (audio.readyState >= 2) {
      void audio.play().catch(onErr);
    } else {
      audio.addEventListener("canplay", onCanPlay, { once: true });
    }
  });
}
