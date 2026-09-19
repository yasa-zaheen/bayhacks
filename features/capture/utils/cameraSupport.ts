export type CameraStartError = {
  message: string;
  hint: string;
};

export function cameraPreflight(): CameraStartError | null {
  if (typeof window === "undefined") return null;

  if (!window.isSecureContext) {
    return {
      message: "Camera needs a secure connection (HTTPS).",
      hint:
        "On iPhone Safari, open the app via https://… not http://192.168.x.x. Use Vercel, ngrok, or run `bun dev --experimental-https` and trust the certificate on your phone.",
    };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      message: "This browser does not support camera capture.",
      hint: "Use Safari 11+ on iPhone, or the Upload tab instead.",
    };
  }

  return null;
}

const CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  {
    video: {
      facingMode: "environment",
      width: { ideal: 1280 },
    },
    audio: false,
  },
  {
    video: { facingMode: "user", width: { ideal: 1280 } },
    audio: false,
  },
  { video: true, audio: false },
];

export async function openCameraStream(): Promise<MediaStream> {
  const preflight = cameraPreflight();
  if (preflight) {
    throw new CameraError(preflight.message, preflight.hint);
  }

  let lastError: unknown;
  for (const constraints of CONSTRAINT_ATTEMPTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export class CameraError extends Error {
  hint: string;

  constructor(message: string, hint: string) {
    super(message);
    this.name = "CameraError";
    this.hint = hint;
  }
}

export function describeCameraError(error: unknown): CameraStartError {
  if (error instanceof CameraError) {
    return { message: error.message, hint: error.hint };
  }

  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: string }).name)
      : "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      message: "Camera permission denied.",
      hint:
        "iPhone: Settings → Safari → Camera → Allow. Then Safari → aA → Website Settings → Camera → Allow. Reload and tap Start session again.",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      message: "No camera found on this device.",
      hint: "Try another device or use the Upload tab.",
    };
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return {
      message: "Camera is in use by another app.",
      hint: "Close other apps using the camera (FaceTime, Camera), then retry.",
    };
  }

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      message: "Camera blocked — connection is not secure.",
      hint:
        "Use HTTPS. Phone + Safari will not grant camera on http:// local IP addresses.",
    };
  }

  return {
    message: "Could not start the camera.",
    hint: "Allow camera access when prompted, or use the Upload tab.",
  };
}
