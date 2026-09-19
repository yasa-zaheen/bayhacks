"use client";

import { VIEW_COPY, type ViewName } from "../types";
import type { RejectedCapture } from "../store/captureStore";

const ISSUE_COPY: Record<string, string> = {
  blur: "Too blurry — hold steady",
  underexposed: "Too dark — add light",
  glare_or_overexposed: "Too much glare",
  framing: "Adjust framing",
  label_obstructed: "Label hard to read — move closer",
};

function formatIssues(codes: string[]) {
  if (!codes.length) return "retake";
  return codes.map((code) => ISSUE_COPY[code] ?? code.replaceAll("_", " ")).join(" · ");
}

type Props = {
  rejected: Partial<Record<ViewName, RejectedCapture>>;
  accepted?: { view: ViewName; dataUrl: string } | null;
};

export function RetakeCompare({ rejected, accepted }: Props) {
  const entries = Object.values(rejected).filter(Boolean) as RejectedCapture[];
  if (!entries.length) return null;

  return (
    <section className="rounded-3xl border border-[#e85d04]/20 bg-[#e85d04]/6 p-4">
      <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#e85d04]">
        Retake compare
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {entries.map((item) => {
          const acceptedShot =
            accepted?.view === item.view ? accepted : null;
          return (
            <div key={item.view} className="grid grid-cols-2 gap-2">
              <CompareCard
                title="Rejected"
                subtitle={formatIssues(item.result.issue_codes)}
                src={item.dataUrl}
                view={item.view}
                tone="bad"
              />
              <CompareCard
                title={acceptedShot ? "Accepted" : "Pending"}
                subtitle={acceptedShot ? "usable" : "retake again"}
                src={acceptedShot?.dataUrl}
                view={item.view}
                tone={acceptedShot ? "good" : "neutral"}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CompareCard({
  title,
  subtitle,
  src,
  view,
  tone,
}: {
  title: string;
  subtitle: string;
  src?: string;
  view: ViewName;
  tone: "good" | "bad" | "neutral";
}) {
  const ring =
    tone === "good"
      ? "ring-[#007d48]/30"
      : tone === "bad"
        ? "ring-[#d30005]/30"
        : "ring-[#e5e5e5]";
  return (
    <div className={`overflow-hidden rounded-2xl bg-white ring-1 ${ring}`}>
      <div className="aspect-[4/3] bg-soft-cloud">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-mute">
            Awaiting retake
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold uppercase">{title}</p>
        <p className="text-[11px] text-mute">
          {VIEW_COPY[view].title} · {subtitle}
        </p>
      </div>
    </div>
  );
}
