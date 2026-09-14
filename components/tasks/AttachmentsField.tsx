"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ALLOWED_ATTACHMENT_TYPES,
  formatFileSize,
  isAllowedAttachmentType,
  MAX_ATTACHMENT_BYTES,
  type AttachmentMeta,
} from "@/lib/attachments";

/** Image attachments for a task — fetches, uploads to, and deletes from /api/tasks/:id/attachments. */
export function AttachmentsField({ taskId }: { taskId: string }) {
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // The parent keys this component by task id, so it fully remounts (and
    // `loading` resets to its initial `true`) whenever the task changes —
    // no need to reset state here, just fetch.
    let cancelled = false;
    fetch(`/api/tasks/${taskId}/attachments`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.attachments) setAttachments(data.attachments);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const uploadOne = async (file: File): Promise<{ ok: boolean; message?: string }> => {
    if (!isAllowedAttachmentType(file.type)) {
      return { ok: false, message: `${file.name}: unsupported image type` };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, message: `${file.name}: too large (max ${formatFileSize(MAX_ATTACHMENT_BYTES)})` };
    }

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, message: body?.error ? `${file.name}: ${body.error}` : `${file.name}: upload failed` };
    }
    const body = await res.json();
    setAttachments((prev) => [...prev, body.attachment]);
    return { ok: true };
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    const failures: string[] = [];
    // Uploaded one at a time (not in parallel) so the list updates in a
    // stable, predictable order and one large image can't starve the rest.
    for (const file of Array.from(fileList)) {
      const result = await uploadOne(file);
      if (!result.ok && result.message) failures.push(result.message);
    }
    if (failures.length > 0) setError(failures.join(" · "));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not remove that image. Please try again.");
        return;
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
        multiple
        className="sr-only"
        id="attachments-input"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {loading ? (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Loading attachments">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4", attachments.length > 0 && "mb-3")}>
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            >
              <a href={`/api/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- DB-backed image, not a static asset next/image can optimize */}
                <img
                  src={`/api/attachments/${att.id}`}
                  alt={att.fileName}
                  className="size-full object-cover"
                />
              </a>
              <button
                type="button"
                onClick={() => handleDelete(att.id)}
                disabled={deletingId === att.id}
                aria-label={`Remove ${att.fileName}`}
                title={`${att.fileName} · ${formatFileSize(att.size)} · ${formatDate(att.createdAt)}`}
                className="absolute top-1 right-1 rounded-full bg-slate-950/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600 focus-visible:opacity-100 disabled:opacity-100"
              >
                {deletingId === att.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor="attachments-input"
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {uploading ? "Uploading…" : "Add image(s)"}
      </label>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        PNG, JPEG, GIF, or WebP · up to {formatFileSize(MAX_ATTACHMENT_BYTES)} each
      </p>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
