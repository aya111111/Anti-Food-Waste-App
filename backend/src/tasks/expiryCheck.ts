import cron from "node-cron";
import { pool } from "../db";

export function startExpiryCron() {
  // runs every day at 8:00 AM server time
  cron.schedule("0 8 * * *", async () => {
    console.log("Running expiry check...");

    const res = await pool.query(
      `SELECT p.*, u.email, u.id as user_id FROM products p
       JOIN users u ON u.id = p.owner_id
       WHERE p.expiry_date <= CURRENT_DATE + INTERVAL '3 days'
         AND p.status = 'available'`
    );

    for (const row of res.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, payload)
         VALUES ($1, $2, $3)`,
        [
          row.user_id,
          "expiry_warning",
          JSON.stringify({
            productId: row.id,
            name: row.name,
            expiry_date: row.expiry_date,
          }),
        ]
      );
    }

    console.log("Expiry job done:", res.rows.length, "notifications created");
  });
}
