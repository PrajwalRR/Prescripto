import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, enum: ['doctor', 'patient'], required: true },
  uploadedAt: { type: Date, default: Date.now }
});


const reportModel = mongoose.models.report || mongoose.model("report", reportSchema);
export default reportModel;
