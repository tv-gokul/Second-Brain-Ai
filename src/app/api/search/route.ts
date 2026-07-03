import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { embedText, toVectorLiteral } from "@/lib/embeddings";

export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  const { query, limit = 8 } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const queryVector = toVectorLiteral(await embedText(query));

  // Cosine distance search via pgvector's <=> operator, joined back to notes
  // so the UI can show which note each match came from.
  const results = await prisma.$queryRawUnsafe<
    { id: string; content: string; noteId: string; title: string; distance: number }[]
  >(
    `SELECT c.id, c.content, c."noteId", n.title, c.embedding <=> $1::vector AS distance
     FROM "Chunk" c
     JOIN "Note" n ON n.id = c."noteId"
     ORDER BY distance ASC
     LIMIT $2`,
    queryVector,
    limit
  );

  return NextResponse.json(results);
}
