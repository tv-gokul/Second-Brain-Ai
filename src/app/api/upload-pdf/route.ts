import { NextRequest, NextResponse } from "next/server";
// 1. IMPORT THIS FIRST: It provides the DOMMatrix polyfill to prevent server crashes
import { CanvasFactory, getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/chunk";
import { embedBatch, toVectorLiteral } from "@/lib/embeddings";
import { auth } from "@/lib/auth"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 2. We can drop the manual node:url/node:path imports and use the cleaner built-in getPath() helper
PDFParse.setWorker(getPath());

export async function POST(req: NextRequest) {
  let parser: PDFParse | null = null;

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

    // Read file to Buffer & Extract Text
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 3. Inject the CanvasFactory here so the parser has a server-safe mock canvas
    parser = new PDFParse({ data: buffer, CanvasFactory });
    
    const pdfData = await parser.getText({
      lineEnforce: false,
      pageJoiner: "",
      cellSeparator: "",
    });
    
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract readable text from PDF" }, { status: 400 });
    }

    // Create Note tied to userId
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

    // Generate Embeddings & Insert in Batches
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
  } finally {
    if (parser) {
      await parser.destroy().catch((cleanupError) => {
        console.error("PDF parser cleanup failure:", cleanupError);
      });
    }
  }
}