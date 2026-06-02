import User from "../../models/user/userModel.js";
import Order from "../../models/user/orderModel.js";
import Wishlist from "../../models/user/wishlistModel.js";
import Wallet from "../../models/user/walletModel.js";
import Otp from "../../models/user/otpModel.js";
import bcrypt from "bcryptjs";
import { generateOTP } from "../../utils/generateOtp.js"; 
import { sendOtpEmail } from "../../utils/sendEmail.js";

export const getProfileDataService = async (userId) => {
    const user = await User.findById(userId);
    const orderCount = await Order.countDocuments({ userId });
    const wishlist = await Wishlist.findOne({ user: userId });
    const wishlistCount = wishlist ? wishlist.items.length : 0;
    const wallet = await Wallet.findOne({ userId });

    return { user, orderCount, wishlistCount, wallet };
};

export const getEditProfileDataService = async (userId) => {
    const user = await User.findById(userId);
    return { user };
};

export const updateProfileService = async (userId, data, reqFile, req) => {
    const user = await User.findById(userId);
    const { name, email, phone, dob, gender, nationality } = data;
    
      const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (!name || !nameRegex.test(name.trim())) {
        return {
            success: false,
            message: "Name must contain only letters and single spaces"
        };
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
        return { success: false, message: "Phone number must be exactly 10 digits" };
    }

    let updateData = { name, phone, dob, gender, nationality };

    if (reqFile) updateData.profileImage = "/uploads/" + reqFile.filename;

    if (user.googleId) {
        await User.findByIdAndUpdate(userId, updateData);
        return { success: true, message: "Profile updated" };
    }

    if (email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) return { success: false, message: "Email already exists" };

        const otp = generateOTP();

        await Otp.findOneAndUpdate(
            { email, type: "email" },
            { otp, expiresAt: Date.now() + 2 * 60 * 1000, type: "email" },
            { upsert: true }
        );

        req.session.newEmail = email;
        req.session.pendingProfileData = { ...updateData, email };

        await sendOtpEmail(email, otp, "verify_email");

        return { success: false, requireOtp: true, message: "OTP sent to new email" };
    }

    await User.findByIdAndUpdate(userId, { ...updateData, email });
    return { success: true, message: "Profile updated successfully" };
};

export const changePasswordService = async (data, req) => {
  const { currentPassword, newPassword, confirmPassword } = data;
  let errors = {};

  if (!currentPassword) errors.currentPassword = ["Current password is required"];
  if (!newPassword) errors.newPassword = ["New password is required"];
  if (!confirmPassword) errors.confirmPassword = ["Confirm password is required"];

  if (Object.keys(errors).length > 0) return { success: false, errors };

  if (newPassword !== confirmPassword) {
    return { success: false, errors: { confirmPassword: ["Passwords do not match"] } };
  }

  const user = await User.findById(req.session.userId);

  if (!user) return { success: false, message: "User not found" };
  if (user.googleId) return { success: false, message: "Google users cannot change password" };

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return { success: false, errors: { currentPassword: ["Current password is incorrect"] } };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  return { success: true };
};
