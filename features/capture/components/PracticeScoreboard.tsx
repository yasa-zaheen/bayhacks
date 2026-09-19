"use client";

import { Badge } from "@/components/ui/badge";
import type { SetResult } from "../types";
import type { PracticeLabels } from "../api/qcClient";

type Props = {
  result: SetResult;
  labels: PracticeLabels | null;
  setId?: string;
};

export function PracticeScoreboard({ result, labels, setId }: Props) {
  if (!labels) return null;

  const photoLabels = new Map(labels.photos.map((row) => [row.image_id, row]));
  let matched = 0;
  let total = 0;

  const rows = result.photos.map((photo) => {
    const expected = photoLabels.get(photo.photo_id);
    if (!expected) return { photo, expected: null, ok: null as boolean | null };
    total += 1;
    const ok =
      expected.status === photo.status &&
      normalizeIssues(expected.issue_codes) === normalizeIssues(photo.issue_codes);
    if (ok) matched += 1;
    return { photo, expected, ok };
  });

  const setLabel = setId
    ? labels.sets.find((row) => row.set_id === setId)
    : null;
  const expectedMissing = setLabel?.missing_views ?? "";
  const missingOk =
    !setId ||
    expectedMissing === result.missing_views.join(";") ||
    (expectedMissing === "" && result.missing_views.length === 0);

  const accuracy = total ? Math.round((matched / total) * 100) : 0;

  return (
    <section className="rounded-3xl border border-[#1151ff]/20 bg-linear-to-br from-[#f5f5f5] to-[#eef4ff] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-mute">
            Practice scoreboard
          </p>
          <p className="mt-1 text-2xl font-medium">{accuracy}% label match</p>
        </div>
        <Badge className="rounded-full bg-ink text-white">
          {matched}/{total || "—"} photos
        </Badge>
      </div>

      {setLabel ? (
        <p className="mt-2 text-sm text-mute">
          Missing views check: {missingOk ? "matches practice key" : "differs from key"}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {rows.map(({ photo, expected, ok }) => (
          <div
            key={photo.photo_id}
            className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-sm ring-1 ring-[#e5e5e5]"
          >
            <div>
              <p className="font-medium">{photo.photo_id}</p>
              <p className="text-xs text-mute">
                predicted {photo.status}
                {expected ? ` · expected ${expected.status}` : ""}
              </p>
            </div>
            {ok === null ? (
              <Badge variant="outline">n/a</Badge>
            ) : ok ? (
              <Badge className="bg-[#007d48] text-white">match</Badge>
            ) : (
              <Badge className="bg-[#d30005] text-white">miss</Badge>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function normalizeIssues(raw: string | string[]) {
  const list = Array.isArray(raw)
    ? raw
    : raw
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
  return list.sort().join("|");
}
