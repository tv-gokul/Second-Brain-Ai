import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const MODEL = "gemini-2.5-flash";

export type RetrievedChunk = {
  noteTitle: string;
  noteId: string;
  content: string;
};

/**
 * Answers a question grounded only in the retrieved chunks, and asks the
 * model to cite which notes it drew from so the UI can link back to them.
 */
export async function answerFromChunks(
  question: string,
  chunks: RetrievedChunk[]
): Promise<string> {
  const context = chunks
    .map((c, i) => `[${i + 1}] (from "${c.noteTitle}")\n${c.content}`)
    .join("\n\n---\n\n");

  const systemInstruction = `You are the user's second brain: you answer questions using ONLY the notes provided below as context. If the notes don't contain the answer, say so plainly instead of guessing. When you use a note, cite it inline like [1], [2] matching the numbered context blocks.

CONTEXT:
${context}`;

  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });
  const result = await model.generateContent(question);
  return result.response.text();
}
