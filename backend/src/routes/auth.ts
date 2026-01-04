import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { authMiddleware } from "../middleware/auth";


const router = Router();

// register
router.post("/register",  async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || name.trim() === "" || password.trim() === "") {
    return res.status(400).json({ 
      error: "All fields are required." 
    });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email",
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "dev");
    res.status(201).json({ user, token });
  } catch (error: any) {
  
    if (error.code === '23505') {
      return res.status(400).json({ error: "This email address is already used." });
    }

    console.error(error);
    res.status(500).json({ error: "Error creating account." });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "dev");

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
});

export default router;
