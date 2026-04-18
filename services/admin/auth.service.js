import Admin from "../../models/admin/adminModel.js";
import bcrypt from "bcrypt";

export const loginAdminService = async (email, password) => {

  // ✅ normalize email
  email = email.toLowerCase().trim();

  console.log("LOGIN EMAIL:", email);

  // 🔥 DEBUG: check all admins
  const allAdmins = await Admin.find();
  console.log("ALL ADMINS:", allAdmins);

  // 🔥 actual query
  const admin = await Admin.findOne({ email });

  console.log("FOUND ADMIN:", admin);

  if (!admin) throw new Error("Invalid email");

  const isMatch = await bcrypt.compare(password, admin.password);

  console.log("MATCH:", isMatch);

  if (!isMatch) throw new Error("Invalid password");

  return admin;
};