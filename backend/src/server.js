import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { randomUUID } from "crypto";
import { itemsRouter } from "./routes/items.js";
import { ingestRouter } from "./routes/ingest.js";
import { queryRouter } from "./routes/query.js";
import { initDb } from "./db/schema.js";
import { logger } from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  req.id = randomUUID();
  next();
});

morgan.token("reqId", (req) => req.id);
app.use(
  morgan(":reqId :method :url :status :response-time ms", {
    stream: { write: (msg) => logger.info({ reqId: msg.split(" ")[0] }, msg.trim()) },
  })
);

app.use("/items", itemsRouter);
app.use("/ingest", ingestRouter);
app.use("/query", queryRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, req, res, _next) => {
  logger.error({ reqId: req.id, err: err.message, stack: err.stack }, "Unhandled error");
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

initDb();

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});
