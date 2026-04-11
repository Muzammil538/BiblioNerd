import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { webhook } from "./controllers/paymentController.js";
import { protect } from "./middleware/auth.js";
import { getMe } from "./controllers/authController.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "biblionerd-api" });
});

app.get("/api/auth/me", protect, getMe);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`,
    hint: "BiblioNerd API expects paths under /api/auth, /api/books, /api/payments",
  });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  const status = err.statusCode || 500;
  const message = err.message || "Server error";
  res.status(status).json({ message });
});

async function start() {
  configureCloudinary();
  await connectDb();
  console.log("MongoDB Connected.");
  app.listen(PORT, () => {
    console.log(`BiblioNerd API listening on port ${PORT}`);
  });
}

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
