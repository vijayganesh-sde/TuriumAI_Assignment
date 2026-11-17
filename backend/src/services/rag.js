import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../utils/logger.js";

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
const model =
  process.env.ANTHROPIC_MODEL ||
  process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL ||
  "claude-haiku-4-5";

const client = apiKey ? new Anthropic({ apiKey }) : null;

const SYSTEM_PROMPT = `You are a knowledge assistant. Answer questions using only the numbered context snippets provided.

Reply with a JSON object — no markdown, no code fences, just the raw JSON:
{
  "answer": "Your direct answer in 1-3 sentences. Plain text only, no markdown syntax.",
  "confidence": "high | medium | low | none",
  "reasoning": "One sentence explaining why you are or are not confident, referencing snippet numbers like [1] or [2].",
  "used_sources": [1, 2]
}

Confidence guide:
- "high"   — answer is clearly and fully supported by the snippets
- "medium" — answer is partially supported or inferred from the snippets
- "low"    — answer is only tangentially related to snippet content
- "none"   — the snippets do not contain relevant information; set answer to "I don't have enough information in my saved content to answer this."

used_sources must list only the snippet numbers [1], [2], etc. that you actually drew from.`;

export async function generateAnswer(question, relevantChunks) {
  if (!client) {
    return buildFallbackAnswer(relevantChunks);
  }

  const contextText = relevantChunks
    .map((chunk, i) => `[${i + 1}] (${chunk.sourceType}: ${chunk.source})\n${chunk.content}`)
    .join("\n\n---\n\n");

  const userMessage = `Context snippets:\n${contextText}\n\nQuestion: ${question}`;

  logger.info({ chunkCount: relevantChunks.length, model }, "Generating RAG answer");

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseStructuredAnswer(response.content[0].text.trim(), relevantChunks);
}

function parseStructuredAnswer(raw, chunks) {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      answer: String(parsed.answer ?? ""),
      confidence: ["high", "medium", "low", "none"].includes(parsed.confidence)
        ? parsed.confidence
        : "low",
      reasoning: String(parsed.reasoning ?? ""),
      usedSources: Array.isArray(parsed.used_sources)
        ? parsed.used_sources.map(Number).filter((n) => n >= 1 && n <= chunks.length)
        : [],
    };
  } catch {
    logger.warn({ raw }, "LLM returned non-JSON; falling back to raw text");
    return { answer: raw, confidence: "low", reasoning: "", usedSources: [] };
  }
}

function buildFallbackAnswer(chunks) {
  return {
    answer: "No LLM configured. Here are the most relevant snippets found.",
    confidence: "none",
    reasoning: "",
    usedSources: chunks.map((_, i) => i + 1),
  };
}
