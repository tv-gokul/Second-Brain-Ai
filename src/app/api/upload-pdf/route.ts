import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/chunk";
import { embedBatch, toVectorLiteral } from "@/lib/embeddings";
import { auth } from "@/lib/auth"; // 1. Imported authentication helper
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const runtime = "nodejs";

PDFParse.setWorker(
  pathToFileURL(resolve(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/web/pdf.worker.mjs")).href
);

export async function POST(req: NextRequest) {
  let parser: PDFParse | null = null;

  try {
    // 2. Authenticate the active user session
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
    parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText({
      lineEnforce: false,
      pageJoiner: "",
      cellSeparator: "",
    });
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract readable text from PDF" }, { status: 400 });
    }

    // 3. Create Note tied to userId (and removed 'source' field)
    const title = file.name.replace(".pdf", "") || "Uploaded PDF Document";
    const note = await prisma.note.create({
      data: {
        title: title,
        content: extractedText,
        userId: session.user.id, // Required relation link
      },
    });

    // Segment into context chunks
    const textChunks = chunkText(extractedText);

    // Generate Embeddings & Insert in Batches
    const chunksToEmbed = textChunks.filter((chunkContent) => chunkContent.trim().length >= 5);
    const vectors = await embedBatch(chunksToEmbed);

    for (let i = 0; i < chunksToEmbed.length; i++) {
      // Create Chunk Row and tie it back to the Note ID
      const chunkRow = await prisma.chunk.create({
        data: {
          content: chunksToEmbed[i],
          noteId: note.id,
        },
      });

      // Inject the pgvector embedding data directly
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