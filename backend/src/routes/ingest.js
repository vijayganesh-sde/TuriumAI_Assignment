import { Router } from "express";
import { body, validationResult } from "express-validator";
import { randomUUID } from "crypto";
import { getDb } from "../db/schema.js";
import { chunkText } from "../services/chunker.js";
import { embedTexts } from "../services/embeddings.js";
import { storeChunks } from "../services/vectorStore.js";
import { fetchUrlContent } from "../services/fetcher.js";
import { logger } from "../utils/logger.js";

export const ingestRouter = Router();

const validators = {
  note: [
    body("content").isString().trim().notEmpty().withMessage("content is required"),
  ],
  url: [
    body("url").isURL({ require_protocol: true }).withMessage("url must be a valid URL with protocol"),
  ],
};

async function handleIngest(req, res, next) {
  const { type } = req.params;

  if (!["note", "url"].includes(type)) {
    return res.status(400).json({ error: "type must be note or url" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", details: errors.array() });
  }

  try {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    let rawContent;
    let source;

    if (type === "note") {
      rawContent = req.body.content.trim();
      source = "note";
    } else {
      source = req.body.url;
      rawContent = await fetchUrlContent(source);
    }

    db.prepare(
      "INSERT INTO items (id, type, source, raw_content, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, type, source, rawContent, now);

    const chunks = chunkText(rawContent);
    if (chunks.length > 0) {
      const embeddings = await embedTexts(chunks);
      storeChunks(id, chunks, embeddings);
    }

    logger.info({ id, type, chunkCount: chunks.length }, "Item ingested");

    res.status(201).json({
      id,
      type,
      source,
      chunkCount: chunks.length,
      createdAt: now,
    });
  } catch (err) {
    next(err);
  }
}

ingestRouter.post("/:type", (req, res, next) => {
  const { type } = req.params;
  const typeValidators = validators[type] || [];
  Promise.all(typeValidators.map((v) => v.run(req))).then(() =>
    handleIngest(req, res, next)
  );
});
