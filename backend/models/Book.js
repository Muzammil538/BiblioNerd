import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, required: true, trim: true, index: true },
    pdfUrl: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    pdfPublicId: { type: String, required: true },
    coverPublicId: { type: String, required: true },
    trendingScore: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
