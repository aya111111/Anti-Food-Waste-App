import { Router, Response } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all products
router.get("/", async (req, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name 
      FROM products p 
      JOIN users u ON p.owner_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Create a new product
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const owner_id = req.user!.id;
  const { name, category, expiry_date, is_shareable } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (owner_id, name, category, quantity, expiry_date, is_shareable)
       VALUES ($1, $2, $3, 1, $4, $5) RETURNING *`,
      [owner_id, name, category, expiry_date, is_shareable]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Claim a product
router.post("/:id/claim", authMiddleware, async (req: AuthRequest, res: Response) => {
  const productId = parseInt(req.params.id, 10);
  const claimer_id = req.user!.id;
  const { message } = req.body;

  try {
    const claimRes = await pool.query(
      `INSERT INTO claims (product_id, claimer_id, message, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [productId, claimer_id, message]
    );
    const claim = claimRes.rows[0];

    const ownerRes = await pool.query(`SELECT owner_id FROM products WHERE id = $1`, [productId]);
    const ownerId = ownerRes.rows[0].owner_id;

    await pool.query(
      `INSERT INTO notifications (user_id, type, payload)
       VALUES ($1, 'new_claim', $2)`,
      [ownerId, JSON.stringify({ claimId: claim.id, productId })]
    );

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: "Error during claim" });
  }
});

// Modify (Share/Unshare)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { is_shareable } = req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET is_shareable = $1 WHERE id = $2 RETURNING *",
      [is_shareable, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const productId = req.params.id;
  const userId = req.user!.id;

  try {
    // 1. On supprime d'abord les claims associés
    await pool.query("DELETE FROM claims WHERE product_id = $1", [productId]);

    // 2. On supprime ensuite le produit si l'utilisateur en est bien le propriétaire
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 AND owner_id = $2",
      [productId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
