import { Router } from "express";
import {
  createOrder,
  getOrderStatus,
  getTransactions,
} from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", protect, createOrder);
router.get("/order/:orderId", protect, getOrderStatus);
router.get("/transactions", protect, admin, getTransactions);

export default router;
