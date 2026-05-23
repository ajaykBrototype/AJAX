import * as profileService from "../../services/user/profile.service.js";
import { verifyEmailOtpService, resendEmailOtpService } from "../../services/user/email.service.js";

export const loadProfile = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");
    const data = await profileService.getProfileDataService(req.session.userId);
    res.render("user/profile", data);
  } catch (error) {
    console.log("❌ PROFILE ERROR:", error);
    res.redirect("/login");
  }
};

export const loadEditProfile = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");
    const data = await profileService.getEditProfileDataService(req.session.userId);
    if (!data.user) return res.redirect("/login");
    res.render("user/editProfile", data);
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfileService(req.session.userId, req.body, req.file, req);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const result = await verifyEmailOtpService(req);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loadChangePassword = (req, res) => {
  res.render("user/changePassword"); 
};

export const changePassword = async (req, res) => {
  try {
    const result = await profileService.changePasswordService(req.body, req);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
