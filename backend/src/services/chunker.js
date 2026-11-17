const CHUNK_SIZE_WORDS = 150;
const OVERLAP_WORDS = 30;

export function chunkText(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += CHUNK_SIZE_WORDS - OVERLAP_WORDS;
  }

  return chunks;
}
