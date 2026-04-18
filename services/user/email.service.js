import User from "../../models/user/userModel.js";
import Otp from "../../models/user/otpModel.js";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";

// 🔹 VERIFY EMAIL OTP
export const verifyEmailOtpService = async (req) => {
  const { otp } = req.body;

  const userId = req.session.userId;
  const newEmail = req.session.newEmail;

  if (!userId || !newEmail) {
    return { success: false, message: "Session expired" };
  }

  if (!otp) {
    return { success: false, message: "OTP required" };
  }

  const record = await Otp.findOne({
    email: newEmail,
    type: "email"
  }).sort({ createdAt: -1 });

  if (!record) {
    return { success: false, message: "OTP not found" };
  }

  if (Date.now() > record.expiresAt) {
    return { success: false, message: "OTP expired" };
  }

  if (String(otp) !== String(record.otp)) {
    return { success: false, message: "Invalid OTP" };
  }

  const existingUser = await User.findOne({
    email: newEmail,
    _id: { $ne: userId }
  });

  if (existingUser) {
    return { success: false, message: "Email already in use" };
  }

  // 🔥 DELETE OTP FIRST (security)
  await Otp.deleteOne({ _id: record._id });

  await User.findByIdAndUpdate(userId, {
    email: newEmail,
    isVerified: true
  });

  delete req.session.newEmail;

  return {
    success: true,
    message: "Email updated successfully"
  };
};


// 🔹 RESEND EMAIL OTP
export const resendEmailOtpService = async (req) => {
  const newEmail = req.session.newEmail;

  if (!newEmail) {
    return { success: false, message: "Session expired" };
  }

  const otp = generateOTP();

  await Otp.findOneAndUpdate(
    { email: newEmail, type: "email" },
    {
      $set: {
        email: newEmail,
        otp,
        expiresAt: Date.now() + 2 * 60 * 1000,
        type: "email"
      }
    },
    { upsert: true }
  );

  await sendOtpEmail(newEmail, otp);

  return {
    success: true,
    message: "OTP resent successfully"
  };
};