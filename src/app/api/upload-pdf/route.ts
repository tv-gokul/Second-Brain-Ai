import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse"; // Note the lowercase 'p' for default import in v1.1.1
import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/chunk";
import { embedBatch, toVectorLiteral } from "@/lib/embeddings";
import { auth } from "@/lib/auth"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Parse the PDF text directly - no workers or canvas required!
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract readable text from PDF" }, { status: 400 });
    }

    // Create Note
    const title = file.name.replace(".pdf", "") || "Uploaded PDF Document";
    const note = await prisma.note.create({
      data: {
        title: title,
        content: extractedText,
        userId: session.user.id, 
      },
    });

    // Segment into context chunks
    const textChunks = chunkText(extractedText);
    const chunksToEmbed = textChunks.filter((chunkContent) => chunkContent.trim().length >= 5);
    const vectors = await embedBatch(chunksToEmbed);

    for (let i = 0; i < chunksToEmbed.length; i++) {
      const chunkRow = await prisma.chunk.create({
        data: {
          content: chunksToEmbed[i],
          noteId: note.id,
        },
      });

      await prisma.$executeRawUnsafe(
        `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
        toVectorLiteral(vectors[i]),
        chunkRow.id
      );
    }

    return NextResponse.json({ success: true, noteId: note.id, message: `Successfully indexed ${textChunks.length} chunks.` });

  } catch (error: any) {
    console.error("PDF Processing Pipeline Failure:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error processing document" },
      { status: 500 }
    );
  } 
}