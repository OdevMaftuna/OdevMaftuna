"use client";

import { useEffect, useRef, useState } from "react";
import { submitAssignment } from "@/app/actions/submissions";
import { Notice, btn } from "@/components/ui";
import { MAX_IMAGES_PER_SUBMISSION, SUBMISSIONS_BUCKET } from "@/lib/config";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import type { SubmissionType } from "@/lib/types";

type ExistingImage = { path: string; url: string };
type NewImage = { id: string; prepared: PreparedImage; previewUrl: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,.heic";

export function SubmissionForm({
  assignmentId,
  userId,
  submissionType,
  initialText,
  initialImages,
  hasSubmission,
}: {
  assignmentId: string;
  userId: string;
  submissionType: SubmissionType;
  initialText: string;
  initialImages: ExistingImage[];
  hasSubmission: boolean;
}) {
  const showText = submissionType !== "image";
  const showImages = submissionType !== "text";

  const [text, setText] = useState(initialText);
  const [kept, setKept] = useState<ExistingImage[]>(initialImages);
  const [added, setAdded] = useState<NewImage[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sahifadan chiqilganda vaqtinchalik ko'rish havolalarini bo'shatish.
  const addedRef = useRef<NewImage[]>([]);
  useEffect(() => {
    addedRef.current = added;
  }, [added]);
  useEffect(
    () => () => addedRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  );

  const imageCount = kept.length + added.length;
  const room = MAX_IMAGES_PER_SUBMISSION - imageCount;

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSaved(false);
    const picked = Array.from(files);
    if (picked.length > room) {
      setError(`You can upload up to ${MAX_IMAGES_PER_SUBMISSION} photos.`);
    }
    setBusy("Preparing the photo…");
    try {
      const next: NewImage[] = [];
      for (const file of picked.slice(0, Math.max(0, room))) {
        const prepared = await prepareImage(file);
        next.push({
          id: crypto.randomUUID(),
          prepared,
          previewUrl: URL.createObjectURL(prepared.blob),
        });
      }
      setAdded((current) => [...current, ...next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t read the photo.");
    } finally {
      setBusy(null);
    }
  };

  const removeAdded = (id: string) =>
    setAdded((current) => {
      current.filter((i) => i.id === id).forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return current.filter((i) => i.id !== id);
    });

  const submit = async () => {
    setError(null);
    setSaved(false);
    const hasText = showText && text.trim().length > 0;
    const hasImages = showImages && imageCount > 0;
    if (!hasText && !hasImages) {
      setError(
        submissionType === "text"
          ? "Write your answer."
          : submissionType === "image"
            ? "Upload at least one photo."
            : "Write text or upload a photo.",
      );
      return;
    }

    try {
      // 1) Yangi rasmlar to'g'ridan-to'g'ri yopiq omborga, o'quvchining o'z papkasiga yuklanadi.
      const uploaded: string[] = [];
      if (showImages && added.length > 0) {
        const supabase = createClient();
        for (const [index, image] of added.entries()) {
          setBusy(`Rasm yuklanmoqda: ${index + 1} / ${added.length}`);
          const path = `${userId}/${assignmentId}/${image.id}.${image.prepared.ext}`;
          const { error: uploadError } = await supabase.storage
            .from(SUBMISSIONS_BUCKET)
            .upload(path, image.prepared.blob, {
              contentType: image.prepared.contentType,
              upsert: false,
            });
          if (uploadError) {
            throw new Error("Couldn’t upload the photo. Check your internet and try again.");
          }
          uploaded.push(path);
        }
      }

      // 2) Javob serverda saqlanadi — muddat shu yerda tekshiriladi.
      setBusy("Sending…");
      const result = await submitAssignment({
        assignmentId,
        text: showText ? text : "",
        imagePaths: showImages ? [...kept.map((i) => i.path), ...uploaded] : [],
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t send your answer.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {showText ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">
            Your answer
          </span>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSaved(false);
            }}
            rows={8}
            maxLength={20000}
            lang="en"
            placeholder="Write your answer here…"
            className="block w-full rounded-xl border border-neutral-300 bg-surface px-3.5 py-3 text-base leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-700/15"
          />
        </label>
      ) : null}

      {showImages ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">
            Photos{" "}
            <span className="font-normal text-neutral-500">
              ({imageCount} / {MAX_IMAGES_PER_SUBMISSION})
            </span>
          </p>

          {imageCount > 0 ? (
            <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                ...kept.map((i) => ({ key: i.path, url: i.url, remove: () => setKept((c) => c.filter((x) => x.path !== i.path)) })),
                ...added.map((i) => ({ key: i.id, url: i.previewUrl, remove: () => removeAdded(i.id) })),
              ].map((image, index) => (
                <li key={image.key} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Photo ${index + 1}`}
                    className="aspect-[3/4] w-full rounded-xl border border-neutral-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      image.remove();
                      setSaved(false);
                    }}
                    disabled={busy !== null}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/65 text-lg leading-none text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {room > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <label className={`${btn.secondary} cursor-pointer`}>
                Take a photo
                <input
                  type="file"
                  accept={ACCEPT}
                  capture="environment"
                  className="sr-only"
                  disabled={busy !== null}
                  onChange={(e) => {
                    void onPick(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <label className={`${btn.secondary} cursor-pointer`}>
                Choose from gallery
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="sr-only"
                  disabled={busy !== null}
                  onChange={(e) => {
                    void onPick(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          ) : null}
          <p className="mt-1.5 text-xs text-neutral-500">
            Take the photo in good light so the writing is clear.
          </p>
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}
      {saved ? <Notice tone="success">Your answer was received.</Notice> : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy !== null}
        className={`${btn.primary} h-12 w-full text-base`}
      >
        {busy ?? (hasSubmission ? "Update my answer" : "Send my answer")}
      </button>
    </div>
  );
}
