import User from "../../models/user/userModel.js";
import Otp from "../../models/user/otpModel.js";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import {
  registerService,
  verifyOtpService,
  resendOtpService,
  loginService,
  resetPasswordService
} from "../../services/user/auth.service.js";

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


export const verifyOtp = async (req, res) => {
  const result = await verifyOtpService(req);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, redirect: result.redirect });
};


export const resendOtp = async (req, res) => {
  const result = await resendOtpService(req);
  res.json(result);
};


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

await Otp.findOneAndUpdate(
  { email, type: "reset" },
  {
    otp,
    expiresAt: Date.now() + 2 * 60 * 1000
  },
  { upsert: true }
);

await sendOtpEmail(email, otp);

// store ONLY email in session (optional)


  console.log("Reset OTP:", otp);

  res.json({ success: true });
};

export const resetPassword = async (req, res) => {
  try {
    const result = await resetPasswordService(req.body, req);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      redirect: "/login"
    });

  } catch (err) {
    console.log("RESET ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error. Try again."
    });
  }
};

export const loadLogin = (req, res) => {
  const isBlocked = req.query.blocked;

  res.render("user/login", { isBlocked });
};

export const loginUser = async (req, res) => {
  try {
    const result = await loginService(req.body);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    req.session.userId = result.user._id;


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
export const googleCallback = (req, res) => {
  req.session.userId = req.user._id;
  res.redirect("/home");
};

export const loadOtpPage = (req, res) => {
  res.render("user/otp");
};

export const loadForgotPassword = (req, res) => {
  req.session.destroy(() => {
    res.render("user/forgotPassword");
  });
};

export const loadResetPassword = (req, res) => {
  if (!req.session.resetEmail) {
    return res.redirect("/forgot-password");
  }
  res.render("user/resetPassword");
};

export const loadHome = (req, res) => {
  res.render("user/home");
};