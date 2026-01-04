import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import groupsRoutes from "./routes/groups";
import claimsRoutes from "./routes/claims";
import { startExpiryCron } from "./tasks/expiryCheck";
import userRoutes from "./routes/users";
import notificationRoutes from "./routes/notifications";


dotenv.config();

const app = express();
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API running" });
});

const port = process.env.PORT || 5050;

app.use("/api/auth", authRoutes);

startExpiryCron();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
