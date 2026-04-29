import User from "../../models/user/userModel.js";
import Otp from "../../models/user/otpModel.js";
import { generateOTP } from "../../utils/generateOtp.js"; // adjust path
import { sendOtpEmail } from "../../utils/sendEmail.js";
import { changePasswordService } from "../../services/user/profile.service.js";
import { verifyEmailOtpService, resendEmailOtpService } from "../../services/user/email.service.js";
export const loadProfile = async (req, res) => {
  try {
    console.log("🔥 PROFILE HIT");
    console.log("SESSION:", req.session);

    if (!req.session.userId) {
      console.log("❌ NO SESSION");
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);

    console.log("USER:", user);

    res.render("user/profile", { user });

  } catch (error) {
    console.log("❌ ERROR:", error);
    res.send("Server Error"); 
  }
};

export const loadEditProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log("USER ID:", userId); // DEBUG

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    res.render("user/editProfile", { user });

  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    const { name, email, phone, dob, gender, nationality } = req.body;

    // VALIDATION
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.json({
        success: false,
        message: "Phone number must be exactly 10 digits"
      });
    }

    let updateData = { name, phone, dob, gender, nationality };

    if (req.file) {
      updateData.profileImage = "/uploads/" + req.file.filename;
    }

    // GOOGLE USER
    if (user.googleId) {
      await User.findByIdAndUpdate(userId, updateData);
      return res.json({ success: true, message: "Profile updated" });
    }

    // EMAIL CHANGE
    if (email !== user.email) {

      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.json({
          success: false,
          message: "Email already exists"
        });
      }

      const otp = generateOTP();

      await Otp.findOneAndUpdate(
        { email, type: "email" },
        {
          otp,
          expiresAt: Date.now() + 2 * 60 * 1000,
          type: "email"
        },
        { upsert: true }
      );

      // Store both for the verify page and the final update
      req.session.newEmail = email;
      req.session.pendingProfileData = {
        ...updateData,
        email
      };

      await sendOtpEmail(email, otp, "verify_email");

      return res.json({
        success: false,
        requireOtp: true,
        message: "OTP sent to new email"
      });
    }

    // NORMAL UPDATE
    await User.findByIdAndUpdate(userId, {
      ...updateData,
      email
    });

    res.json({ success: true, message: "Profile updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const result = await verifyEmailOtpService(req);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const loadChangePassword = (req, res) => {
  res.render("user/changePassword"); 
};


export const changePassword = async (req, res) => {
  try {
    console.log("API HIT 🔥");

    const result = await changePasswordService(req.body, req);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
