import Book from "../models/Book.js";
import { cloudinary } from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

function assertActiveSubscription(user) {
  if (user?.role === "admin") {
    return true;
  }
  const sub = user.subscription;
  if (!sub || !sub.isActive) {
    return false;
  }
  if (!sub.endDate) {
    return false;
  }
  if (new Date(sub.endDate) < new Date()) {
    return false;
  }
  return true;
}

export const listBooks = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category && category !== "all") {
    filter.category = category;
  }
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { author: new RegExp(search, "i") },
    ];
  }
  const books = await Book.find(filter).sort({ updatedAt: -1 });
  return res.json({ books });
});

export const trendingBooks = asyncHandler(async (_req, res) => {
  const books = await Book.find().sort({ trendingScore: -1, updatedAt: -1 }).limit(8);
  return res.json({ books });
});

export const categories = asyncHandler(async (_req, res) => {
  const distinct = await Book.distinct("category");
  return res.json({ categories: distinct.sort() });
});

export const getBook = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  return res.json({ book });
});

export const createBook = asyncHandler(async (req, res) => {
  const cover = req.files?.cover?.[0];
  const pdf = req.files?.pdf?.[0];
  if (!cover || !pdf) {
    return res.status(400).json({ message: "Cover image and PDF are required" });
  }
  const { title, author, description, category, trendingScore } = req.body;
  if (!title || !author || !category) {
    return res.status(400).json({ message: "Title, author, and category are required" });
  }
  const coverUrl = cover.path;
  const pdfUrl = pdf.path;
  const coverPublicId = cover.filename;
  const pdfPublicId = pdf.filename;
  const book = await Book.create({
    title,
    author,
    description: description || "",
    category,
    pdfUrl,
    coverImageUrl: coverUrl,
    pdfPublicId,
    coverPublicId,
    trendingScore:
      trendingScore !== undefined && trendingScore !== ""
        ? Number(trendingScore) || 0
        : 0,
  });
  return res.status(201).json({ book });
});

export const updateBook = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const { title, author, description, category, trendingScore } = req.body;
  if (!title || !author || !category) {
    return res.status(400).json({ message: "Title, author, and category are required" });
  }

  book.title = title;
  book.author = author;
  book.description = description || "";
  book.category = category;
  book.trendingScore = trendingScore !== undefined && trendingScore !== "" ? Number(trendingScore) || 0 : book.trendingScore;

  await book.save();

  return res.json({ book });
});

export const signedReaderUrl = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }
  if (!assertActiveSubscription(req.user)) {
    return res.status(403).json({ message: "An active subscription is required to read books" });
  }
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
  const pdfSigned = cloudinary.url(book.pdfPublicId, {
    resource_type: "raw",
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    type: "upload",
  });
  return res.json({
    pdfUrl: pdfSigned,
    title: book.title,
    expiresAt,
  });
});

export const deleteBook = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid book id" });
  }
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  try {
    await cloudinary.uploader.destroy(book.coverPublicId, { resource_type: "image" });
  } catch {
    /* ignore cleanup errors */
  }
  try {
    await cloudinary.uploader.destroy(book.pdfPublicId, {
      resource_type: "raw",
      invalidate: true,
    });
  } catch {
    /* ignore cleanup errors */
  }
  await book.deleteOne();
  return res.json({ message: "Book removed" });
});
