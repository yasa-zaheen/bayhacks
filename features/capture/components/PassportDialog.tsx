"use client";

import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCaptureStore } from "../store/captureStore";
import { VIEW_COPY, type PhotoStatus, type ViewName } from "../types";

const STATUS_CLASS: Record<PhotoStatus, string> = {
  usable: "bg-[#007d48] text-white",
  retake: "bg-[#d30005] text-white",
  needs_review: "bg-[#c58a00] text-white",
};

function gradeTint(letter: string) {
  if (letter === "A") return "#1eaa52";
  if (letter === "B") return "#1151ff";
  if (letter === "C") return "#c58a00";
  return "#d30005";
}

export function PassportDialog() {
  const result = useCaptureStore((s) => s.result);
  const open = useCaptureStore((s) => s.passportOpen);
  const setOpen = useCaptureStore((s) => s.setPassportOpen);
  const uris = useCaptureStore((s) => s.photoUris);

  if (!result) return null;
  const p = result.passport;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[440px]"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Digital Product Passport</DialogTitle>
          <DialogDescription>
            Condition grade, circular route, and capture checklist for this
            device.
          </DialogDescription>
        </DialogHeader>

        <article className="overflow-hidden rounded-[28px] bg-white text-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <header className="relative bg-linear-to-br from-[#0a7281] via-[#1151ff] to-[#4c012d] px-6 pt-6 pb-8 text-white">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase opacity-80">
              American Circular
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-medium leading-tight">
                  Digital Product Passport
                </h2>
                <p className="mt-2 font-mono text-[11px] tracking-wide opacity-90">
                  {p.passport_id}
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(p.issued_at).toUTCString()}
                </p>
              </div>
              <div className="rounded-xl bg-white p-2">
                <QRCodeSVG value={p.passport_id} size={84} />
              </div>
            </div>
          </header>

          <div className="relative">
            <span className="absolute top-0 left-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40" />
            <span className="absolute top-0 right-0 size-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40" />
            <div className="border-t border-dashed border-[#cacacb]" />
          </div>

          <div className="space-y-5 px-6 py-6">
            <section>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
                Device
              </p>
              <p className="mt-1 text-xl font-medium">{p.device_title}</p>
              <p className="mt-1 text-sm text-mute">Class: {p.device_class}</p>
              <p className="mt-2 text-sm font-medium">
                <span style={{ color: gradeTint(p.condition_grade.letter) }}>
                  Grade {p.condition_grade.letter}
                </span>
                {"  ·  "}
                {p.condition_grade.label}
              </p>
            </section>

            <section className="rounded-2xl bg-linear-to-br from-[#f5f5f5] to-[#eef7f6] p-4">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0a7281]">
                Circular route
              </p>
              <p className="mt-1 text-lg font-medium">
                {p.route.title} — ${p.route.est_value_usd}
              </p>
              <p className="mt-1 text-sm text-mute">{p.route.reason}</p>
              <p className="mt-2 text-sm font-medium text-[#007d48]">
                {p.route.co2_kg_saved} kg CO₂ saved vs landfill
              </p>
            </section>

            <section>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
                Fraud check
              </p>
              {p.fraud.flags.length ? (
                <ul className="mt-2 space-y-1 text-sm text-sale">
                  {p.fraud.flags.map((flag, i) => (
                    <li key={`${flag.code}-${i}`}>
                      {flag.code}: {flag.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#007d48]">
                  No mismatch or tamper flags detected.
                </p>
              )}
            </section>

            {result.missing_views.length > 0 && (
              <section className="rounded-2xl border border-[#d30005]/20 bg-[#d30005]/6 p-4">
                <p className="text-sm font-medium text-sale">
                  Missing views: {result.missing_views.join(", ")}
                </p>
                <p className="mt-1 text-sm text-mute">{result.missing_reason}</p>
              </section>
            )}

            <section className="space-y-3">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
                Capture checklist
              </p>
              {result.photos.map((photo) => {
                const src = uris[photo.photo_id] ?? photo.localUri;
                const status = photo.status as PhotoStatus;
                const view = photo.intended_view as ViewName;
                return (
                  <div
                    key={photo.photo_id}
                    className="overflow-hidden rounded-2xl ring-1 ring-[#e5e5e5]"
                  >
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={photo.intended_view}
                        className="h-36 w-full object-cover bg-soft-cloud"
                      />
                    ) : null}
                    <div className="space-y-1 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium uppercase">
                          {VIEW_COPY[view]?.title ?? photo.intended_view}
                        </p>
                        <Badge className={STATUS_CLASS[status] ?? ""}>
                          {photo.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-mute">{photo.reason}</p>
                      {photo.retake_guidance ? (
                        <p className="text-sm text-[#e85d04]">
                          {photo.retake_guidance}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </section>

            <section>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-mute">
                Disassembly playbook
              </p>
              <ol className="mt-3 space-y-3">
                {p.playbook.map((step) => (
                  <li key={step.step} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-cloud text-xs font-semibold">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-sm text-mute">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <Button
              className="h-12 w-full rounded-full"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </article>
      </DialogContent>
    </Dialog>
  );
}
