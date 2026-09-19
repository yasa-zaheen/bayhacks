"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyzePracticeSet,
  analyzeSet,
  fetchCatalog,
  practiceImageUrl,
} from "../api/analyze";
import { useCaptureStore } from "../store/captureStore";
import {
  REQUIRED_VIEWS,
  VIEW_COPY,
  type PracticeSet,
  type ViewName,
} from "../types";

type UploadItem = {
  id: string;
  file: File;
  url: string;
  view: ViewName;
};

const VIEW_ITEMS = REQUIRED_VIEWS.map((view) => ({
  value: view,
  label: VIEW_COPY[view].title,
}));

export function UploadPanel() {
  const setResult = useCaptureStore((s) => s.setResult);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [setId, setSetId] = useState<string>("SET-001");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCatalog()
      .then((catalog) => {
        setSets(catalog.sets);
        if (catalog.sets[0]) setSetId(catalog.sets[0].set_id);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).map((file, index) => ({
      id: `${file.name}-${index}`,
      file,
      url: URL.createObjectURL(file),
      view: REQUIRED_VIEWS[index % REQUIRED_VIEWS.length],
    }));
    setItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.url));
      return next;
    });
    setError("");
  }

  async function onEvaluateUploads() {
    if (!items.length) return;
    setBusy(true);
    setError("");
    try {
      const result = await analyzeSet(
        items.map((item) => ({
          file: item.file,
          intended_view: item.view,
          name: item.file.name,
        }))
      );
      const uris: Record<string, string> = {};
      result.photos.forEach((photo, index) => {
        if (items[index]) uris[photo.photo_id] = items[index].url;
      });
      setResult(result, uris);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setBusy(false);
    }
  }

  async function onEvaluatePractice() {
    if (!setId) return;
    setBusy(true);
    setError("");
    try {
      const result = await analyzePracticeSet(setId);
      const uris: Record<string, string> = {};
      for (const photo of result.photos) {
        uris[photo.photo_id] = practiceImageUrl(photo.photo_id);
      }
      setResult(result, uris);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Practice set failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
            Dataset
          </p>
          <h2 className="mt-2 text-[32px] font-medium leading-[1.2]">
            Upload device photos
          </h2>
          <p className="mt-2 text-base text-mute">
            Assign each file an intended view. A blurry front is a retake, not a
            missing view.
          </p>
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-sm file:mr-4 file:h-12 file:rounded-full file:border-0 file:bg-ink file:px-8 file:text-sm file:font-medium file:text-white"
          onChange={(event) => onFiles(event.target.files)}
        />

        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-soft-cloud p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.file.name}
                className="size-16 object-cover"
              />
              <Select
                value={item.view}
                onValueChange={(value) => {
                  if (!value) return;
                  setItems((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, view: value as ViewName } : row
                    )
                  );
                }}
                items={VIEW_ITEMS}
              >
                <SelectTrigger className="min-w-40 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUIRED_VIEWS.map((view) => (
                    <SelectItem key={view} value={view}>
                      {VIEW_COPY[view].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="truncate text-xs text-mute">{item.file.name}</span>
            </div>
          ))}
        </div>

        <Button
          className="h-12 w-fit rounded-full px-8"
          onClick={onEvaluateUploads}
          disabled={busy || items.length === 0}
        >
          {busy ? "Evaluating…" : "Evaluate set"}
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-mute">
            Practice library
          </p>
          <h2 className="mt-2 text-[24px] font-medium leading-[1.2]">
            American Circular sets
          </h2>
          <p className="mt-2 text-base text-mute">
            SET-004, SET-007, and SET-009 omit a required view on purpose.
          </p>
        </div>

        <Select
          value={setId}
          onValueChange={(value) => value && setSetId(value)}
          items={sets.map((set) => ({
            value: set.set_id,
            label: `${set.set_id} · ${set.device_id}`,
          }))}
        >
          <SelectTrigger className="w-full max-w-sm rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sets.map((set) => (
              <SelectItem key={set.set_id} value={set.set_id}>
                {set.set_id} · {set.device_id}
                {set.missing_views.length
                  ? ` (missing ${set.missing_views.join(", ")})`
                  : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="h-12 w-fit rounded-full px-8"
          variant="secondary"
          onClick={onEvaluatePractice}
          disabled={busy || !setId}
        >
          Run practice set
        </Button>

        {error ? (
          <p className="text-sm text-sale">{error}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">usable</Badge>
            <Badge variant="outline">retake</Badge>
            <Badge variant="outline">needs review</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
