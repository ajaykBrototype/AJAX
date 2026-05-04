
import User from "../../models/user/userModel.js";
import bcrypt from "bcryptjs";

export const changePasswordService = async (data, req) => {
  const { currentPassword, newPassword, confirmPassword } = data;
  console.log("1. Data received:", !!currentPassword, !!newPassword);
  let errors = {};


  if (!currentPassword) {
    errors.currentPassword = ["Current password is required"];
  }
  if (!newPassword) {
    errors.newPassword = ["New password is required"];
  }
  if (!confirmPassword) {
    errors.confirmPassword = ["Confirm password is required"];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }


  if (newPassword !== confirmPassword) {
    return {
      success: false,
      errors: {
        confirmPassword: ["Passwords do not match"]
      }
    };
  }

 
  const user = await User.findById(req.session.userId);

  if (!user) {
    console.log("2. User not found in DB");
    return { success: false, message: "User not found" };
  }
  if (user.googleId) {
  return {
    success: false,
    message: "Google users cannot change password"
  };
}

  const isMatch = await bcrypt.compare(currentPassword, user.password);
console.log("3. Password match result:", isMatch);
  if (!isMatch) {
    return {
      success: false,
      errors: {
        currentPassword: ["Current password is incorrect"]
      }
    };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  console.log("4. User password updated successfully");
  return { success: true };
};
