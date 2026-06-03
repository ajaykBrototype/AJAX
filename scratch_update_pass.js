import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "./models/admin/adminModel.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const updateAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await Admin.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL || "admin@gmail.com" },
      { password: hashedPassword },
      { upsert: true, new: true }
    );
    console.log("✅ Admin password updated to Admin@123");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateAdmin();
