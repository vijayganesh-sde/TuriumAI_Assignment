import { useState, useCallback } from "react";
import { fetchItems, deleteItem } from "../api.js";

export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchItems();
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(
    async (id) => {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    []
  );

  return { items, loading, error, load, remove };
}
