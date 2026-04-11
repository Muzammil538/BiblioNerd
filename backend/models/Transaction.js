import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "pending"],
      default: "created",
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    cfPaymentId: { type: String, default: null },
    rawWebhook: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
