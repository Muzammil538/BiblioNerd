import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";

const allowedImageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "pdf") {
      return {
        folder: "biblionerd/pdfs",
        resource_type: "raw",
      };
    }
    return {
      folder: "biblionerd/covers",
      resource_type: "image",
    };
  },
});

export const uploadBookFields = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.fieldname === "pdf") {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Book PDF must be a PDF file"));
      }
    } else if (file.fieldname === "cover") {
      if (!allowedImageMimes.has(file.mimetype)) {
        return cb(new Error("Cover must be JPEG, PNG, or WEBP"));
      }
    }
    return cb(null, true);
  },
}).fields([
  { name: "cover", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);
