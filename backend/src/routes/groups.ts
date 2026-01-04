import { Router, Response } from "express";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// Create a group
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  const owner_id = req.user!.id;

  try {
    const groupRes = await pool.query(
      `INSERT INTO groups (owner_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [owner_id, name, description]
    );

    const group = groupRes.rows[0];

    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [group.id, owner_id]
    );

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get all groups for the logged-in user
router.get("/my-groups", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT g.*
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Invite a friend (owner-only)
router.post("/:groupId/invite", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { friendId } = req.body;
  const { groupId } = req.params;
  const gid = parseInt(groupId, 10);
  const requesterId = req.user!.id;

  if (!friendId) {
    return res.status(400).json({ error: "Missing friendId in request body" });
  }

  try {

    const ownerRes = await pool.query(
      `SELECT owner_id FROM groups WHERE id = $1`,
      [gid]
    );

    if (ownerRes.rowCount === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (ownerRes.rows[0].owner_id !== requesterId) {
      return res.status(403).json({ error: "Only the group owner can invite members" });
    }


    const checkMember = await pool.query(
      `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [gid, friendId]
    );

    if (checkMember.rowCount && checkMember.rowCount > 0) {
      return res.status(400).json({ error: "User is already in this group" });
    }

    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [gid, friendId]
    );

    res.json({ message: "Friend invited successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add friend" });
  }
});

// Get all members of a specific group
router.get("/:groupId/members", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const gid = parseInt(groupId, 10);
  const requesterId = req.user!.id;

  try {

    const membershipCheck = await pool.query(
      `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [gid, requesterId]
    );

    if (membershipCheck.rowCount === 0) {
      return res.status(403).json({ error: "Access denied. You are not a member of this group." });
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, gm.role, gm.preferences
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.role DESC`, 
      [gid]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

export default router;
