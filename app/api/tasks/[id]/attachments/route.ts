import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_ATTACHMENT_TYPES,
  isAllowedAttachmentType,
  MAX_ATTACHMENT_BYTES,
  type AttachmentMeta,
} from "@/lib/attachments";

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

const ATTACHMENT_META_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const;

// GET /api/tasks/:id/attachments — list attachment metadata (never the bytes)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachments = await prisma.attachment.findMany({
    where: { taskId: id },
    select: ATTACHMENT_META_SELECT,
    orderBy: { createdAt: "asc" },
  });
  const data: AttachmentMeta[] = attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));
  return NextResponse.json({ attachments: data });
}

// POST /api/tasks/:id/attachments — upload one image (multipart/form-data, field "file")
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!isAllowedAttachmentType(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type. Allowed: ${ALLOWED_ATTACHMENT_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: `Image is too large. Max size is ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB.` },
      { status: 422 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const attachment = await prisma.attachment.create({
    data: {
      taskId: id,
      fileName: file.name || "image",
      mimeType: file.type,
      size: bytes.byteLength,
      data: bytes,
    },
    select: ATTACHMENT_META_SELECT,
  });

  revalidateTaskPaths();
  const data: AttachmentMeta = { ...attachment, createdAt: attachment.createdAt.toISOString() };
  return NextResponse.json({ attachment: data }, { status: 201 });
}
