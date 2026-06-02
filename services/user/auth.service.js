import User from "../../models/user/userModel.js";
import Wallet from "../../models/user/walletModel.js";
import Otp from "../../models/user/otpModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import bcrypt from "bcryptjs";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";
import { signupSchema } from "../../validators/authValidator.js";

export const registerService = async (data, req) => {
  const result = signupSchema.safeParse(data);

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  const { name, email, password, referralCode } = result.data;

  if (referralCode && referralCode.trim() !== "") {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) return { success: false, errors: { referralCode: ["Invalid referral code"] } };
    if (referrer.email === email) return { success: false, errors: { referralCode: ["You cannot use your own referral code"] } };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return { success: false, errors: { email: ["Email already exists"] } };

  const otp = generateOTP();
  const hashedPassword = await bcrypt.hash(password, 10);

  await Otp.findOneAndUpdate(
    { email, type: "signup" },
    { $set: { email, otp, expiresAt: Date.now() + 2 * 60 * 1000, type: "signup", tempData: { name, password: hashedPassword, referralCode } } },
    { upsert: true }
  );

  req.session.tempEmail = email;
  req.session.type = "signup";

  await sendOtpEmail(email, otp, "signup");

  return { success: true };
};

export const verifyOtpService = async (req) => {
  const { otp } = req.body;
  const email = req.session.type === "reset" ? req.session.resetEmail : req.session.tempEmail;

  const record = await Otp.findOne({ email, type: req.session.type });
  if (!record) return { success: false, errors: { otp: ["OTP not found"] } };
  if (Date.now() > record.expiresAt) return { success: false, errors: { otp: ["OTP expired"] } };
  if (String(otp) !== String(record.otp)) return { success: false, errors: { otp: ["Invalid OTP"] } };

  if (record.type === "signup") {
    const { name, password, referralCode } = record.tempData;
    const generatedReferralCode = "AJX" + Math.random().toString(36).substring(2, 8).toUpperCase();
    let referredBy = null;

    if (referralCode && referralCode.trim() !== "") {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) return { success: false, errors: { referralCode: ["Invalid referral code"] } };
      if (referrer.email === email) return { success: false, errors: { referralCode: ["You cannot use your own referral code"] } };

      referredBy = referrer._id;
      
      const newTransaction = {
          transactionId: "REF-INC-" + Date.now(),
          type: "credit",
          amount: 200,
          description: "Referral Bonus",
          date: new Date()
      };

      await Wallet.findOneAndUpdate(
        { userId: referrer._id },
        { 
          $inc: { balance: 200 },
          $push: { transactions: newTransaction }
        },
        { upsert: true, new: true }
      );
    }
    
    const newUser = await User.create({ name, email, password, referralCode: generatedReferralCode, referredBy });
    
    if (referredBy) {
      await Wallet.create({ 
        userId: newUser._id, 
        balance: 50,
        transactions: [{
          transactionId: "REF-WLC-" + Date.now(),
          type: "credit",
          amount: 50,
          description: "Signup Referral Bonus",
          date: new Date()
        }]
      });
    } else {
      await Wallet.create({ userId: newUser._id, balance: 0 });
    }
  }

  if (record.type === "reset") return { success: true, redirect: "/reset-password" };

  await Otp.deleteOne({ _id: record._id });
  return { success: true, redirect: "/login" };
};

export const resendOtpService = async (req) => {
  const email = req.session.type === "reset" ? req.session.resetEmail : req.session.tempEmail;
  if (!email) return { success: false, message: "Session expired" };

  const otp = generateOTP();
  await Otp.findOneAndUpdate(
    { email, type: req.session.type },
    { otp, expiresAt: Date.now() + 2 * 60 * 1000 }
  );

  await sendOtpEmail(email, otp, req.session.type);
  return { success: true };
};

export const forgotPasswordService = async (email, req) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, statusCode: 400, message: "User not found" };

  const otp = generateOTP();

  await Otp.findOneAndUpdate(
    { email, type: "reset" },
    { otp, expiresAt: Date.now() + 2 * 60 * 1000 },
    { upsert: true }
  );

  await sendOtpEmail(email, otp, "reset");

  req.session.resetEmail = email;
  req.session.type = "reset";

  return { success: true, statusCode: 200 };
};

export const resetPasswordService = async (data, req) => {
  const { password, confirmPassword } = data;
  if (password !== confirmPassword) return { success: false, errors: { confirmPassword: ["Passwords do not match"] } };

  const email = req.session.resetEmail;
  const hashed = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate({ email }, { password: hashed });
  req.session.destroy();

  return { success: true };
};

export const loginService = async (data) => { 
  try {
    const { email, password } = data;
    if (!email || !password) return { success: false, message: "Email and password are required", status: 400 };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return { success: false, message: "User not found", status: 401 };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { success: false, message: "Incorrect password", status: 401 };

    return { success: true, user };
  } catch (err) {
    console.error("Service Error:", err);
    throw err; 
  }
};

export const getHomeProductsService = async () => {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(4);
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        productObj.variants = await Variant.find({ productId: product._id, isActive: true });
        return productObj;
      })
    );
    return productsWithVariants;
};


