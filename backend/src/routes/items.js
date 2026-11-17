import { Router } from "express";
import { getDb } from "../db/schema.js";

export const itemsRouter = Router();

itemsRouter.get("/", (_req, res) => {
  const db = getDb();
  const items = db
    .prepare(
      `SELECT id, type, source,
              substr(raw_content, 1, 300) AS preview,
              created_at
       FROM items
       ORDER BY created_at DESC`
    )
    .all();

  res.json({ items });
});

itemsRouter.delete("/:id", (req, res, next) => {
  try {
    const db = getDb();
    const result = db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
