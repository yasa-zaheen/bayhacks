import { create } from "zustand";
import type { PhotoResult, SetResult, Shot, ViewName } from "../types";

export type RejectedCapture = {
  view: ViewName;
  dataUrl: string;
  result: PhotoResult;
};

export type CoachMode = "demo" | "operator";

type CaptureState = {
  mode: CoachMode;
  shots: Shot[];
  photoResults: Record<string, PhotoResult>;
  result: SetResult | null;
  photoUris: Record<string, string>;
  passportOpen: boolean;
  celebrationOpen: boolean;
  rejectedByView: Partial<Record<ViewName, RejectedCapture>>;
  retakeCount: number;
  playbookUnlockStep: number;
  setMode: (mode: CoachMode) => void;
  addShot: (shot: Shot, result: PhotoResult) => void;
  setRejected: (capture: RejectedCapture) => void;
  clearRejected: (view: ViewName) => void;
  setResult: (result: SetResult, uris?: Record<string, string>) => void;
  setPassportOpen: (open: boolean) => void;
  setCelebrationOpen: (open: boolean) => void;
  setPlaybookUnlockStep: (step: number) => void;
  resetSession: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  mode: "demo",
  shots: [],
  photoResults: {},
  result: null,
  photoUris: {},
  passportOpen: false,
  celebrationOpen: false,
  rejectedByView: {},
  retakeCount: 0,
  playbookUnlockStep: 0,

  setMode: (mode) => set({ mode }),

  addShot: (shot, result) =>
    set((state) => {
      const rejected = { ...state.rejectedByView };
      delete rejected[shot.view];
      const playbookUnlockStep = Math.max(
        state.playbookUnlockStep,
        state.shots.length + 1
      );
      return {
        shots: [...state.shots.filter((s) => s.view !== shot.view), shot],
        photoResults: { ...state.photoResults, [shot.id]: result },
        photoUris: { ...state.photoUris, [shot.id]: shot.dataUrl },
        rejectedByView: rejected,
        playbookUnlockStep,
      };
    }),

  setRejected: (capture) =>
    set((state) => ({
      rejectedByView: { ...state.rejectedByView, [capture.view]: capture },
      retakeCount: state.retakeCount + 1,
    })),

  clearRejected: (view) =>
    set((state) => {
      const rejected = { ...state.rejectedByView };
      delete rejected[view];
      return { rejectedByView: rejected };
    }),

  setResult: (result, uris = {}) =>
    set((state) => ({
      result,
      photoUris: { ...state.photoUris, ...uris },
      passportOpen: true,
      playbookUnlockStep: result.photos.filter((p) => p.status === "usable")
        .length,
    })),

  setPassportOpen: (open) => set({ passportOpen: open }),
  setCelebrationOpen: (open) => set({ celebrationOpen: open }),
  setPlaybookUnlockStep: (step) => set({ playbookUnlockStep: step }),

  resetSession: () =>
    set({
      shots: [],
      photoResults: {},
      result: null,
      photoUris: {},
      passportOpen: false,
      celebrationOpen: false,
      rejectedByView: {},
      retakeCount: 0,
      playbookUnlockStep: 0,
    }),
}));
