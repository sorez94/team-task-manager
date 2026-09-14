// Shared client/server constants for image attachments. Kept in one place
// (like the parse/format helpers in lib/utils.ts) so the upload route and
// the form's client-side pre-check enforce exactly the same rules.

// Vercel's serverless functions cap the request body around 4.5MB; images
// are sent as raw multipart bytes (no base64 inflation), so 4MB per file
// leaves comfortable headroom for multipart boundary/header overhead.
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

export type AllowedAttachmentType = (typeof ALLOWED_ATTACHMENT_TYPES)[number];

export function isAllowedAttachmentType(mimeType: string): mimeType is AllowedAttachmentType {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(mimeType);
}

/** Metadata-only shape of an Attachment — never carries the image bytes. */
export type AttachmentMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

/** Formats a byte count compactly, e.g. 800 -> "800 B", 15400 -> "15 KB", 3200000 -> "3.1 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
