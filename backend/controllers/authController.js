import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sanitizeUser = (userDoc) => ({
  id: userDoc._id.toString(),
  name: userDoc.name,
  email: userDoc.email,
  phone: userDoc.phone || "",
  role: userDoc.role,
  subscription: userDoc.subscription,
  createdAt: userDoc.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email is already registered" });
  }
  const user = await User.create({
    name,
    email,
    password,
    phone: phone ? String(phone).trim() : "",
    role: "user",
  });
  const token = generateToken(user._id);
  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const match = await user.matchPassword(password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = generateToken(user._id);
  const safe = await User.findById(user._id);
  return res.json({
    token,
    user: sanitizeUser(safe),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});
