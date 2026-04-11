import { Router } from "express";
import {
  listBooks,
  trendingBooks,
  categories,
  getBook,
  createBook,
  updateBook,
  signedReaderUrl,
  deleteBook,
} from "../controllers/bookController.js";
import { protect, admin } from "../middleware/auth.js";
import { uploadBookFields } from "../middleware/upload.js";

const router = Router();

router.get("/trending", trendingBooks);
router.get("/categories/list", categories);
router.get("/book-categories", categories);
router.get("/:id/read", protect, signedReaderUrl);
router.get("/:id", getBook);
router.get("/", listBooks);

router.post(
  "/",
  protect,
  admin,
  (req, res, next) => {
    uploadBookFields(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      return next();
    });
  },
  createBook
);

router.put("/:id", protect, admin, updateBook);
router.delete("/:id", protect, admin, deleteBook);

export default router;
