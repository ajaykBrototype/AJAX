import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../models/admin/adminModel.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await Admin.create({
      email: "admin@gmail.com",
      password: hashedPassword
    });

    console.log("✅ Admin created:", admin);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();