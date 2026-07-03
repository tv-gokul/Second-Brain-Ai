import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/chunk";
import { embedBatch, toVectorLiteral } from "@/lib/embeddings";

// Define the correct Next.js 15 context type
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  // Await the params promise before using the id
  const { id } = await params;

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  // Await the params promise before using the id
  const { id } = await params;

  // Inside your PUT handler...
const body = await req.json();
const { title, content, tags } = body; // Destructure it here so it doesn't cause errors

const note = await prisma.note.update({
  where: { id },
  data: { title, content }, // Removed tags from here!
});
 

  // Re-chunk and re-embed on every edit. Fine for a portfolio-scale app;
  // for bigger notes you'd diff and only re-embed changed chunks.
  await prisma.chunk.deleteMany({ where: { noteId: note.id } });
  const pieces = chunkText(content);
  const vectors = await embedBatch(pieces);
  for (let i = 0; i < pieces.length; i++) {
    const chunk = await prisma.chunk.create({
      data: { noteId: note.id, content: pieces[i] },
    });
    await prisma.$executeRawUnsafe(
      `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
      toVectorLiteral(vectors[i]),
      chunk.id
    );
  }

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  // Await the params promise before using the id
  const { id } = await params;

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}