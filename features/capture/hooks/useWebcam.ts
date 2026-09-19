"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cameraPreflight,
  describeCameraError,
  openCameraStream,
} from "../utils/cameraSupport";

type WebcamState = {
  stream: MediaStream | null;
  error: string;
  hint: string;
  starting: boolean;
};

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<WebcamState>({
    stream: null,
    error: "",
    hint: "",
    starting: false,
  });

  const start = useCallback(async () => {
    const blocked = cameraPreflight();
    if (blocked) {
      setState({
        stream: null,
        starting: false,
        error: blocked.message,
        hint: blocked.hint,
      });
      return false;
    }

    setState((prev) => ({ ...prev, starting: true, error: "", hint: "" }));
    try {
      const stream = await openCameraStream();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => undefined);
      }
      setState({ stream, error: "", hint: "", starting: false });
      return true;
    } catch (error) {
      const described = describeCameraError(error);
      setState({
        stream: null,
        starting: false,
        error: described.message,
        hint: described.hint,
      });
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      prev.stream?.getTracks().forEach((track) => track.stop());
      return { stream: null, error: "", hint: "", starting: false };
    });
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  useEffect(() => {
    return () => {
      state.stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    active: Boolean(state.stream),
    error: state.error,
    hint: state.hint,
    starting: state.starting,
    start,
    stop,
    captureFrame,
  };
}
