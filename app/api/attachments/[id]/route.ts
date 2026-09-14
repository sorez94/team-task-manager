import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

// GET /api/attachments/:id — streams the raw image bytes, for use as an
// <img src="..."> directly. Aggressively cacheable: attachments are
// immutable (delete-and-reupload rather than edit-in-place), and the id is
// unguessable, so there's no reason for a client to ever revalidate one.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: { data: true, mimeType: true, fileName: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  return new NextResponse(attachment.data, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// DELETE /api/attachments/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.attachment.delete({ where: { id } });
    revalidateTaskPaths();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
