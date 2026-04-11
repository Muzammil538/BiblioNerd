import { Router } from "express";
import {
  createOrder,
  getOrderStatus,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", protect, createOrder);
router.get("/order/:orderId", protect, getOrderStatus);

export default router;
