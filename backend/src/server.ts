import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import { startExpiryCron } from "./tasks/expiryCheck";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);


app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API running" });
});

const port = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);

startExpiryCron();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
