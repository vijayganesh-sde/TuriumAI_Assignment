import { Router } from "express";
import { body, validationResult } from "express-validator";
import { embedQuery } from "../services/embeddings.js";
import { searchSimilarChunks } from "../services/vectorStore.js";
import { generateAnswer } from "../services/rag.js";
import { logger } from "../utils/logger.js";

export const queryRouter = Router();

const validateQuery = [
  body("question").isString().trim().notEmpty().withMessage("question is required"),
  body("topK").optional().isInt({ min: 1, max: 20 }).withMessage("topK must be 1-20"),
];

queryRouter.post("/", validateQuery, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", details: errors.array() });
  }

  const { question, topK = 5 } = req.body;

  try {
    const queryEmbedding = await embedQuery(question);
    const relevantChunks = searchSimilarChunks(queryEmbedding, Number(topK));

    if (relevantChunks.length === 0) {
      return res.json({
        answer: "No relevant content found. Please add some notes or URLs first.",
        sources: [],
      });
    }

    const structured = await generateAnswer(question, relevantChunks);

    logger.info(
      { question: question.slice(0, 80), sourcesCount: relevantChunks.length, confidence: structured.confidence },
      "Query answered"
    );

    const sources = relevantChunks.map((c, i) => ({
      id: c.id,
      itemId: c.itemId,
      source: c.source,
      sourceType: c.sourceType,
      snippet: c.content.slice(0, 300),
      score: Math.round(c.score * 1000) / 1000,
      cited: structured.usedSources.includes(i + 1),
    }));

    res.json({
      answer: structured.answer,
      confidence: structured.confidence,
      reasoning: structured.reasoning,
      sources,
    });
  } catch (err) {
    next(err);
  }
});
