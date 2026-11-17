import { logger } from "../utils/logger.js";

const docFrequency = new Map();
let totalDocs = 0;

const VECTOR_DIM = 512;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && t.length < 30);
}

// FNV-1a — maps tokens to a fixed-dimension slot without a separate vocabulary table
function hashToken(token) {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % VECTOR_DIM;
}

function computeTfIdf(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return new Array(VECTOR_DIM).fill(0);

  const tf = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }

  const vec = new Array(VECTOR_DIM).fill(0);
  for (const [term, count] of tf) {
    const tfScore = count / tokens.length;
    const df = docFrequency.get(term) || 1;
    const idf = Math.log((totalDocs + 1) / df + 1);
    vec[hashToken(term)] += tfScore * idf;
  }

  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= mag;
  }
  return vec;
}

function updateDocFrequency(text) {
  const tokens = new Set(tokenize(text));
  for (const t of tokens) {
    docFrequency.set(t, (docFrequency.get(t) || 0) + 1);
  }
  totalDocs++;
}

export async function embedTexts(texts) {
  if (texts.length === 0) return [];
  logger.info({ count: texts.length, provider: "tfidf-local" }, "Generating embeddings");
  for (const text of texts) updateDocFrequency(text);
  return texts.map(computeTfIdf);
}

export async function embedQuery(text) {
  logger.info({ provider: "tfidf-local" }, "Embedding query");
  return computeTfIdf(text);
}
