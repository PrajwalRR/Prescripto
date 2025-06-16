import express from 'express';
import multer from 'multer';
import path from 'path';
import reportModel from '../models/reportModel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Local disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

router.post('/upload-report', authMiddleware, upload.single('report'), async (req, res) => {
  try {
    const { appointmentId, uploadedBy } = req.body;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/reports/${req.file.filename}`; // Local path to serve

    const report = new reportModel({
      userId,
      appointmentId,
      url: fileUrl,
      uploadedBy,
    });

    await report.save();

    res.status(200).json({
      success: true,
      message: "Report uploaded successfully",
      url: fileUrl,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

export default router;
