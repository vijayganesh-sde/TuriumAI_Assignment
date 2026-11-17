# AI Knowledge Inbox

A minimal production-style web app that lets you save notes and URLs, then ask questions over your saved content using a RAG pipeline.

**Stack:** Node.js + Express · React + Vite · SQLite · Anthropic Claude

---

## Local Setup

**Prerequisites:** Node.js 18+ and an Anthropic API key.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY=sk-ant-...
npm install
npm start
# → http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> The frontend Vite dev server proxies all `/ingest`, `/items`, and `/query` requests to the backend automatically — no CORS config needed during development.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingest/note` | Save a plain-text note |
| `POST` | `/ingest/url` | Fetch and save a URL's content |
| `GET` | `/items` | List all saved items |
| `DELETE` | `/items/:id` | Delete an item and its chunks |
| `POST` | `/query` | Ask a question over saved content |

**POST /ingest/note**
```json
{ "content": "Your note text here" }
```

**POST /ingest/url**
```json
{ "url": "https://example.com/article" }
```

**POST /query**
```json
{ "question": "What is X?", "topK": 5 }
```
Response includes `answer`, `confidence` (high/medium/low/none), `reasoning`, and `sources` (cited only).

---

## Architecture

```
frontend (React/Vite :5173)
    └── Vite proxy → backend (Express :3001)
                         ├── routes/ingest.js   POST /ingest/:type
                         ├── routes/items.js    GET|DELETE /items
                         ├── routes/query.js    POST /query
                         ├── services/
                         │   ├── chunker.js     text → chunks
                         │   ├── embeddings.js  chunks → vectors (TF-IDF)
                         │   ├── vectorStore.js SQLite BLOB store + cosine search
                         │   ├── fetcher.js     URL fetch + HTML extraction
                         │   └── rag.js         LLM answer generation
                         ├── db/schema.js       SQLite schema (items + chunks)
                         └── utils/logger.js    structured JSON logger
```

---

## Design Decisions & Tradeoffs

### Chunking — fixed word-window with overlap
Words are split into 150-word windows with a 30-word overlap. The overlap preserves context at chunk boundaries so a sentence split across two chunks doesn't lose meaning in either. This is simpler than recursive paragraph-aware splitting and fully deterministic.

**Tradeoff:** Paragraph-aware chunking would respect natural document structure better, but adds complexity and behaves inconsistently across different content types (web pages vs. notes vs. PDFs).

### Embeddings — local TF-IDF (no API cost)
Term-frequency / inverse-document-frequency vectors are hash-projected to a fixed 512-dimensional space and L2-normalised. This requires zero API calls and works fully offline.

**Tradeoff:** TF-IDF cannot match semantic synonyms — "car" and "automobile" score as unrelated. The embeddings module is a single file (`services/embeddings.js`) with a stable interface (`embedTexts`, `embedQuery`); using dense embeddings would require implementing and configuring a separate embedding provider.

### Vector store — SQLite BLOBs + brute-force cosine search
Embeddings are stored as `Float32Array` BLOBs in SQLite alongside the chunks that produced them. Search loads all vectors into memory and scores them with cosine similarity in a single pass.

**Tradeoff:** O(n) search is fast enough below ~10k chunks (under 50 ms measured). Above that, an HNSW index in pgvector or Qdrant would be the right move. The SQLite approach has the major advantage of zero extra infrastructure — the whole store is a single file that persists across restarts.

### LLM — Anthropic Claude with structured JSON output
The system prompt instructs Claude to reply with a strict JSON object (`answer`, `confidence`, `reasoning`, `used_sources`). The backend parses this and exposes `confidence` and per-source `cited` flags to the frontend. Sources not cited by the LLM are excluded from the response.

**Tradeoff:** Structured output via prompt instruction is less reliable than the Anthropic API's native tool-use / JSON mode, but avoids schema changes to the API surface. The parser strips accidental markdown fences and falls back to raw text rather than erroring.

### What breaks at scale
| Problem | Threshold | Fix |
|---------|-----------|-----|
| Brute-force vector search | ~10k chunks | pgvector / Qdrant + HNSW |
| SQLite write contention | >1 concurrent writer | Postgres |
| Synchronous URL fetch blocks request | Large pages / slow sites | Bull queue + async job |
| No streaming on `/query` | Long LLM responses feel slow | SSE streaming |
| TF-IDF synonym blindness | Domain-specific vocabulary | Dense embeddings |
| No rate limiting | Abuse / runaway ingestion | express-rate-limit |
