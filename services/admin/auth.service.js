import Admin from "../../models/admin/adminModel.js";
import bcrypt from "bcrypt";

export const loginAdmin = async (email, password) => {

  const admin = await Admin.findOne({ email });
  
console.log("FOUND ADMIN:", admin);
  if (!admin) throw new Error("Invalid email");

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) throw new Error("Invalid password");

  return admin;
};