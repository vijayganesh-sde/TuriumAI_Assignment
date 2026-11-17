import { getDb } from "../db/schema.js";
import { logger } from "../utils/logger.js";

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function deserializeEmbedding(blob) {
  const float32 = new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
  return Array.from(float32);
}

function serializeEmbedding(embedding) {
  return Buffer.from(new Float32Array(embedding).buffer);
}

export function storeChunks(itemId, chunks, embeddings) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO chunks (id, item_id, content, chunk_idx, embedding)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });

  const rows = chunks.map((content, idx) => [
    `${itemId}-chunk-${idx}`,
    itemId,
    content,
    idx,
    serializeEmbedding(embeddings[idx]),
  ]);

  insertMany(rows);
  logger.info({ itemId, chunkCount: chunks.length }, "Chunks stored");
}

export function searchSimilarChunks(queryEmbedding, topK = 5) {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT c.id, c.item_id, c.content, c.chunk_idx, c.embedding,
             i.type, i.source, i.created_at
      FROM chunks c
      JOIN items i ON i.id = c.item_id
      WHERE c.embedding IS NOT NULL
    `)
    .all();

  if (rows.length === 0) return [];

  const scored = rows.map((row) => ({
    score: cosineSimilarity(queryEmbedding, deserializeEmbedding(row.embedding)),
    chunk: {
      id: row.id,
      itemId: row.item_id,
      content: row.content,
      chunkIdx: row.chunk_idx,
      sourceType: row.type,
      source: row.source,
      createdAt: row.created_at,
    },
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));
}
