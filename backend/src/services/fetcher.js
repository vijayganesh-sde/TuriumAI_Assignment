import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { logger } from "../utils/logger.js";

export async function fetchUrlContent(url) {
  logger.info({ url }, "Fetching URL content");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AIKnowledgeInbox/1.0)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status} fetching URL`), { status: 422 });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw Object.assign(
      new Error(`Unsupported content type: ${contentType}. Only HTML and plain text are supported.`),
      { status: 422 }
    );
  }

  const html = await response.text();

  if (contentType.includes("text/plain")) return html;

  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, noscript").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim();
  logger.info({ url, charCount: text.length }, "URL content extracted");
  return text;
}
