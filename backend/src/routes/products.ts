import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const { owner, shareable } = req.query;

  let q = "SELECT * FROM products";
  const params: any[] = [];

  if (owner) {
    params.push(owner);
    q += ` WHERE owner_id = $${params.length}`;
  }

  if (shareable) {
    if (params.length > 0) q += ` AND is_shareable = true`;
    else q += ` WHERE is_shareable = true`;
  }

  const result = await pool.query(q, params);
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { owner_id, name, category, quantity, expiry_date, is_shareable } = req.body;

  const result = await pool.query(
    `INSERT INTO products (owner_id,name,category,quantity,expiry_date,is_shareable)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [owner_id, name, category, quantity, expiry_date, is_shareable]
  );

  res.status(201).json(result.rows[0]);
});

router.post("/:id/claim", async (req, res) => {
  const productId = req.params.id;
  const { claimer_id, message } = req.body;

  try {
    // 1. Create claim entry
    const claimRes = await pool.query(
      `INSERT INTO claims (product_id, claimer_id, message)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [productId, claimer_id, message]
    );
    const claim = claimRes.rows[0];

    // 2. Find product owner
    const ownerRes = await pool.query(
      `SELECT owner_id FROM products WHERE id = $1`,
      [productId]
    );

    if (ownerRes.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const ownerId = ownerRes.rows[0].owner_id;

    // 3. Insert notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, payload)
       VALUES ($1,$2,$3)`,
      [
        ownerId,
        "new_claim",
        JSON.stringify({
          claimId: claim.id,
          productId,
          claimer_id,
        }),
      ]
    );

    // 4. Return claim
    res.status(201).json(claim);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while claiming product" });
  }
});

export default router;
