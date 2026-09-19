import type { SetResult } from "../types";

/** Deterministic live-demo device — ASUS ROG Strix G531GT (presenter prop). */
export const LIVE_DEMO_DEVICE = {
  device_title: "ASUS ROG Strix G531GT",
  device_class: "gaming_laptop",
  model: "G531GT",
  asset_serial: "R3NRCX012847391",
  route: {
    code: "refurb" as const,
    title: "Refurbish",
    reason:
      "Complete usable photo set, legible serial tag, and Grade A cosmetic — list on refurb channel.",
    est_value_usd: 385,
    co2_kg_saved: 11.2,
    materials: {
      aluminum: 18,
      copper: 8,
      plastics: 34,
      pcb: 22,
      battery: 18,
    },
  },
  playbook: [
    {
      step: 1,
      title: "Disconnect and drain",
      body: "Shut down, unplug, and press power 5 seconds. Remove the bottom panel screws (Torx).",
    },
    {
      step: 2,
      title: "Storage and RAM",
      body: "Pop the M.2 SSD and any SODIMMs. Bag modules with the serial tag photo reference.",
    },
    {
      step: 3,
      title: "Battery first for R2",
      body: "Disconnect the battery cable before touching the WLAN card or heat pipes.",
    },
    {
      step: 4,
      title: "Mainboard harvest",
      body: "If the chassis is damaged, harvest CPU/GPU module and fans; route shell to plastics stream.",
    },
  ],
};

export function applyLiveDemoPassport(result: SetResult): SetResult {
  const allUsable =
    result.photos.every((p) => p.status === "usable") &&
    result.missing_views.length === 0;
  if (!allUsable) return result;

  return {
    ...result,
    passport: {
      ...result.passport,
      device_title: LIVE_DEMO_DEVICE.device_title,
      device_class: LIVE_DEMO_DEVICE.device_class,
      model: LIVE_DEMO_DEVICE.model,
      asset_serial: LIVE_DEMO_DEVICE.asset_serial,
      route: { ...result.passport.route, ...LIVE_DEMO_DEVICE.route },
      playbook: LIVE_DEMO_DEVICE.playbook,
      fraud: {
        risk: "low",
        flags: [],
      },
    },
  };
}
