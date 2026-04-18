import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  type: {
    type: String, // signup | reset | email
    required: true
  },
   tempData: {
    type: Object
  }
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);