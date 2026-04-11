import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET is not set" });
  }
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    let user;
    try {
      user = await User.findById(userId);
    } catch {
      return res.status(503).json({ message: "Database unavailable" });
    }
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function admin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Administrator access required" });
}
