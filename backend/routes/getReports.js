import express from 'express';
import reportModel from '../models/reportModel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/get-reports/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;

    const reports = await reportModel.find({ appointmentId });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch reports" });
  }
});

export default router;
