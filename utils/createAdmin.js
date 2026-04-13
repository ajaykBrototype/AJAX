import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import Admin from "../models/admin/adminModel.js"; // ✅ correct path

mongoose.connect(process.env.MONGO_URI);
 

const createAdmin = async () => {
    console.log("SCRIPT RUNNING 🔥");

  const existing = await Admin.findOne({ email: "admin@gmail.com" });

  if (existing) {
    console.log("Admin already exists ✅");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    email: "admin@gmail.com",
    password: hashedPassword
  });

  console.log("Admin created ✅");
  process.exit();
};

createAdmin();