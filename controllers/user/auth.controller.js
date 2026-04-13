import User from "../../models/user/userModel.js";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import {
  registerService,
  verifyOtpService,
  resendOtpService,
  loginService,
  resetPasswordService
} from "../../services/user/auth.service.js";
import { success } from "zod";
import { fa } from "zod/locales";

export const loadSignup = (req, res) => {
  res.render("user/signup");
};

export const registerUser = async (req, res) => {
  const result = await registerService(req.body, req);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, redirect: "/otp" });
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  const result = await verifyOtpService(req);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, redirect: result.redirect });
};

// RESEND
export const resendOtp = async (req, res) => {
  const result = await resendOtpService(req);
  res.json(result);
};

// FORGOT
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found"
    });
  }

  const otp = generateOTP();

  req.session.resetEmail = email;
  req.session.otp = otp;
  req.session.otpExpiry = Date.now() + 2 * 60 * 1000;
  req.session.type = "reset";

  await sendOtpEmail(email, otp);

  console.log("Reset OTP:", otp);

  res.json({ success: true });
};

// RESET
export const resetPassword = async (req, res) => {
  const result = await resetPasswordService(req.body, req);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, redirect: "/login" });
};

// LOGIN
export const loadLogin = (req, res) => {
  const isBlocked = req.query.blocked;

  res.render("user/login", { isBlocked });
};

export const loginUser = async (req, res) => {
  try {
    const result = await loginService(req.body);

    if (!result.success) {
      // The Service returned an error object, so we send it using 'res'
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    req.session.userId = result.user._id;

    // ✅ FINAL RESPONSE
    return res.json({ 
      success: true, 
      message: "Login successful", 
      redirect: "/home" 
    });

  } catch (err) {
    console.error("Controller Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/home");
    }

    res.clearCookie("connect.sid");

    return res.redirect("/login");
  });
};