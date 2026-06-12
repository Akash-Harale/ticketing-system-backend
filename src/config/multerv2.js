// src/config/multerv2.js
import multer from "multer";
import path from "path";
import fs from "fs";

// File type filter (images + mp4 only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG/JPG/PNG/GIF) or MP4 are allowed!"), false);
  }
};

// Factory function to create upload middleware with dynamic folder
export const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join("uploads", folderName);

      // Ensure directory exists
      fs.mkdirSync(dir, { recursive: true });

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Preserve original extension
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext);

      // Generate unique filename with extension intact
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Max 20MB
    fileFilter,
  });
};
