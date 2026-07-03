import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // 1. Imported authentication helper
import { embedText, toVectorLiteral } from "@/lib/embeddings";
import { answerFromChunks, RetrievedChunk } from "@/lib/llm";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    // 2. Authenticate the user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // Generate Embeddings (Can throw a 503 if Gemini is overloaded)
    let queryVector;
    try {
      const rawEmbedding = await embedText(question);
      queryVector = toVectorLiteral(rawEmbedding);
    } catch (embedError: any) {
      console.error("Gemini Embedding API Error:", embedError);
      return NextResponse.json(
        { error: "The AI embedding service is temporarily busy. Please try resending your message in a moment." },
        { status: 503 }
      );
    }

    // 3. SECURE VECTOR DB QUERY: Join with user verification filter
    // Restricts distance calculations specifically within the user's isolated workspace boundary ($2)
    const matches = await prisma.$queryRawUnsafe<
      { content: string; noteId: string; title: string }[]
    >(
      `SELECT c.content, c."noteId", n.title
       FROM "Chunk" c
       JOIN "Note" n ON n.id = c."noteId"
       WHERE n."userId" = $2
       ORDER BY c.embedding <=> $1::vector ASC
       LIMIT 6`,
      queryVector,
      session.user.id
    );

    const chunks: RetrievedChunk[] = matches.map((m) => ({
      noteTitle: m.title,
      noteId: m.noteId,
      content: m.content,
    }));

    // Generate Answer from Chunks (Can also throw a 503)
    let answer;
    try {
      answer = await answerFromChunks(question, chunks);
    } catch (llmError: any) {
      console.error("Gemini Chat Completion API Error:", llmError);
      return NextResponse.json(
        { error: "The AI text generation service is temporarily busy. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      answer,
      sources: chunks.map((c, i) => ({ index: i + 1, title: c.noteTitle, noteId: c.noteId })),
    });

  } catch (globalError: any) {
    console.error("Fatal RAG Pipeline Error:", globalError);
    return NextResponse.json(
      { error: "An unexpected internal server error occurred." },
      { status: 500 }
    );
  }
}