import User from "../../models/user/userModel.js";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";

export const verifyEmailOtpService = async (req) => {
  const { otp } = req.body;

  if (!req.session.emailOtp || !req.session.newEmail) {
    return { success: false, message: "Session expired" };
  }

  if (Date.now() > req.session.emailOtpExpiry) {
    return { success: false, message: "OTP expired" };
  }

  if (String(otp) !== String(req.session.emailOtp)) {
    return { success: false, message: "Invalid OTP" };
  }

  const user = await User.findById(req.session.userId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  const existingUser = await User.findOne({
    email: req.session.newEmail
  });

  if (existingUser) {
    return { success: false, message: "Email already in use" };
  }

 await User.findByIdAndUpdate(req.session.userId, {
  ...req.session.pendingProfileData,
  email: req.session.newEmail,
  isVerified: true
});

  delete req.session.emailOtp;
  delete req.session.newEmail;
  delete req.session.emailOtpExpiry;
  delete req.session.pendingProfileData;

  return {
    success: true,
    message: "Email updated successfully"
  };
};


// 🔁 RESEND OTP
export const resendEmailOtpService = async (req) => {
  // ❌ NO SESSION
  if (!req.session.newEmail) {
    return {
      success: false,
      message: "Session expired"
    };
  }

  // ✅ GENERATE NEW OTP
  const otp = generateOTP();

  // ✅ STORE IN SESSION
  req.session.emailOtp = otp;
  req.session.emailOtpExpiry = Date.now() + 2 * 60 * 1000; // 2 min

  // ✅ SEND EMAIL
  await sendOtpEmail(req.session.newEmail, otp);

  return {
    success: true,
    message: "OTP resent successfully"
  };
};