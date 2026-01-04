import { Router, Response } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Get incoming claims for products owned by the authenticated user
router.get("/incoming", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name as product_name, u.name as claimer_name 
       FROM claims c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON c.claimer_id = u.id
       WHERE p.owner_id = $1 AND c.status = 'pending'`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incoming claims" });
  }
});

// Accept or reject a claim
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const claimId = req.params.id;

  try {
    const updatedRes = await pool.query(
      `UPDATE claims SET status = $1 WHERE id = $2 RETURNING *`,
      [status, claimId]
    );
    const claim = updatedRes.rows[0];

    if (status === "accepted") {
      await pool.query(`UPDATE products SET status = 'claimed' WHERE id = $1`, [claim.product_id]);

      await pool.query(`UPDATE claims SET status = 'rejected' WHERE product_id = $1 AND id != $2`, [claim.product_id, claimId]);
    }

    await pool.query(
      `INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3)`,
      [claim.claimer_id, `claim_${status}`, JSON.stringify({ productId: claim.product_id })]
    );

    res.json({ message: `Claim ${status}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to process action" });
  }
});

// Get products claimed by the authenticated user
router.get("/my-claims", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const result = await pool.query(
      "SELECT product_id FROM claims WHERE claimer_id = $1",
      [userId]
    );

    const ids = result.rows.map(row => Number(row.product_id));
    
    console.log(`User ${userId} has claimed products:`, ids);
    res.json(ids); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
