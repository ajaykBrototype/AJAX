import { success } from "zod";
import User from "../../models/user/userModel.js";
import { changePasswordService } from "../../services/user/profile.service.js";
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
    res.send("Server Error"); // 👈 TEMP SHOW ERROR
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

    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      dob: req.body.dob,
      gender: req.body.gender,
      nationality: req.body.nationality
    };

    // ✅ IMAGE SAVE
    if (req.file) {
      updateData.profileImage = "/uploads/" + req.file.filename;
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};


export const loadChangePassword = (req, res) => {
  res.render("user/changePassword"); // your EJS file name
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
