import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const EMBEDDING_MODEL = "gemini-embedding-001";
// Gemini's embedding model outputs 3072 dims by default; we ask for a
// smaller size to keep storage/compute light. Must match the `vector(N)`
// size in prisma/schema.prisma if you change it.
const OUTPUT_DIMS = 768;

const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

export async function embedText(text: string): Promise<number[]> {
  const res = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: OUTPUT_DIMS,
  } as any);
  return res.embedding.values;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // Gemini's embedContent takes one input at a time, so we fan out and
  // await together. Fine at portfolio scale; batch/queue it if this grows.
  return Promise.all(texts.map((t) => embedText(t)));
}

/** Formats a JS number array as the string literal pgvector expects. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
