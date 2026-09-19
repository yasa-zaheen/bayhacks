"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WebcamState = {
  stream: MediaStream | null;
  error: string;
  starting: boolean;
};

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<WebcamState>({
    stream: null,
    error: "",
    starting: false,
  });

  const start = useCallback(async () => {
    setState((prev) => ({ ...prev, starting: true, error: "" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState({ stream, error: "", starting: false });
      return true;
    } catch {
      setState({
        stream: null,
        starting: false,
        error: "Camera blocked — allow webcam access or use Upload instead.",
      });
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      prev.stream?.getTracks().forEach((track) => track.stop());
      return { stream: null, error: "", starting: false };
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
    return canvas.toDataURL("image/jpeg", 0.85);
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
    starting: state.starting,
    start,
    stop,
    captureFrame,
  };
}
