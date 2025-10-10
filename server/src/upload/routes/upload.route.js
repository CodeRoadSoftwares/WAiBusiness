import express from "express";
import { uploadSingle, uploadMultiple } from "../../services/s3.service.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Single image upload
router.post("/single", requireAuth, (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "Upload failed",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      message: "File uploaded successfully",
      url: req.file.location,
      key: req.file.key,
    });
  });
});

// Multiple images upload
router.post("/multiple", requireAuth, (req, res) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "Upload failed",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const fileData = req.files.map((file) => ({
      url: file.location,
      key: file.key,
      originalName: file.originalname,
    }));

    res.json({
      message: `${req.files.length} files uploaded successfully`,
      files: fileData,
    });
  });
});

export default router;
