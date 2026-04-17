import { Router } from "express";
import {
  getAllUsers,
  toggleBlockUser,
  getFavorites,
  addFavorite,
  removeFavorite,
  getRecentlyViewed,
  addRecentlyViewed
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, admin, getAllUsers);
router.put("/:id/block", protect, admin, toggleBlockUser);

router.get("/favorites", protect, getFavorites);
router.post("/favorites/:bookId", protect, addFavorite);
router.delete("/favorites/:bookId", protect, removeFavorite);

router.get("/recently-viewed", protect, getRecentlyViewed);
router.post("/recently-viewed/:bookId", protect, addRecentlyViewed);

export default router;
