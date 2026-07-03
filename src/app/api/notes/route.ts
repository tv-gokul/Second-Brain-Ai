import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Imports your session helper
import { embedText, toVectorLiteral } from "@/lib/embeddings";

// 1. GET Handler: Fetch notes belonging ONLY to the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST Handler: Save a new text note tied to the user's ID
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    // Create the note inside the user's profile context
    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: session.user.id,
      },
    });

    // Baseline implementation logic for chunking simple strings
    const chunkLength = 500;
    const textChunks = content.match(new RegExp(`.{1,${chunkLength}}`, "g")) || [content];

    for (const textChunk of textChunks) {
      const rawEmbedding = await embedText(textChunk);
      const vectorLiteral = toVectorLiteral(rawEmbedding);

      const chunkRow = await prisma.chunk.create({
        data: {
          content: textChunk,
          noteId: note.id,
        },
      });

      await prisma.$executeRawUnsafe(
        `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
        vectorLiteral,
        chunkRow.id
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}