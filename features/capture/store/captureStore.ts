import { create } from "zustand";
import type { SetResult, Shot } from "../types";

type CaptureState = {
  shots: Shot[];
  result: SetResult | null;
  photoUris: Record<string, string>;
  passportOpen: boolean;
  addShot: (shot: Shot) => void;
  setResult: (result: SetResult, uris?: Record<string, string>) => void;
  setPassportOpen: (open: boolean) => void;
  resetSession: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  shots: [],
  result: null,
  photoUris: {},
  passportOpen: false,

  addShot: (shot) =>
    set((state) => ({
      shots: [...state.shots, shot],
      photoUris: { ...state.photoUris, [shot.id]: shot.dataUrl },
    })),

  setResult: (result, uris = {}) =>
    set((state) => ({
      result,
      photoUris: { ...state.photoUris, ...uris },
      passportOpen: true,
    })),

  setPassportOpen: (open) => set({ passportOpen: open }),

  resetSession: () =>
    set({
      shots: [],
      result: null,
      photoUris: {},
      passportOpen: false,
    }),
}));
