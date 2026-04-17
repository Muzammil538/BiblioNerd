import User from "../models/User.js";
import Book from "../models/Book.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone || "",
    role: userDoc.role,
    subscription: userDoc.subscription,
    isBlocked: userDoc.isBlocked,
    createdAt: userDoc.createdAt,
  };
}

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(sanitizeUser) });
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.role === "admin") {
    return res.status(400).json({ message: "Cannot block admins" });
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ user: sanitizeUser(user) });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  res.json({ favorites: user.favorites || [] });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (!user.favorites.includes(bookId)) {
    user.favorites.push(bookId);
    await user.save();
  }
  res.json({ message: "Book added to favorites" });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  user.favorites = user.favorites.filter(id => id.toString() !== bookId);
  await user.save();
  res.json({ message: "Book removed from favorites" });
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("recentlyViewed.bookId")
    .lean();
  const sorted = (user.recentlyViewed || [])
    .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    .slice(0, 10)
    .map(r => r.bookId)
    .filter(Boolean);
  res.json({ recentlyViewed: sorted });
});

export const addRecentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const bookId = req.params.bookId;
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });

  let viewList = user.recentlyViewed || [];
  const existingIndex = viewList.findIndex(r => r.bookId.toString() === bookId);
  if (existingIndex > -1) {
    viewList[existingIndex].viewedAt = new Date();
  } else {
    viewList.push({ bookId, viewedAt: new Date() });
  }
  
  // Keep only last 20
  viewList = viewList.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)).slice(0, 20);
  user.recentlyViewed = viewList;
  try {
    await user.save();
  } catch (err) {
    if (err.name !== "VersionError") {
      throw err;
    }
  }
  res.json({ message: "Added to recently viewed" });
});
