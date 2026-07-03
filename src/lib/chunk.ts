/**
 * Splits text into overlapping chunks so embeddings capture local context
 * without losing the thread between chunks. Sizes are in characters, which
 * is a rough but dependency-free stand-in for tokens (~4 chars/token).
 */
export function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 200
): string[] {
  const clean = text.trim();
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end).trim());
    if (end === clean.length) break;
    start = end - overlap;
  }

  return chunks.filter(Boolean);
}
