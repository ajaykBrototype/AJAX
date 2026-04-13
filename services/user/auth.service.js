import User from "../../models/user/userModel.js";
import { signupSchema } from "../../validators/authValidator.js";
import bcrypt from "bcryptjs";
import { generateOTP } from "../../utils/generateOtp.js";
import { sendOtpEmail } from "../../utils/sendEmail.js";

// REGISTER
export const registerService = async (data, req) => {

  const result = signupSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors
    };
  }

  const { name, email, password } = result.data;

// if (!name || !email || !password || !confirmPassword) {
//     return {
//       success: false,
//       errors: {
//         name: !name ? ["Name is required"] : null,
//         email: !email ? ["Email is required"] : null,
//         password: !password ? ["Password is required"] : null,
//         confirmPassword: !confirmPassword ? ["Please confirm password"] : null
//       }
//     };
//   }
//  if (password.length < 6) {
//   return {
//     success: false,
//     error: { password: ["Minimum 6 characters"] }
//   };
// }

//   if (password !== confirmPassword) {
//     return {
//       success: false,
//       errors: { confirmPassword: ["Passwords do not match"] }
//     };
//   }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return {
      success: false,
      errors: { email: ["Email already exists"] }
    };
  }
try {
    const otp = generateOTP();
     req.session.tempUser = { name, email, password };

  req.session.otp = otp;

  req.session.otpExpiry = Date.now() + 2 * 60 * 1000;

  req.session.type = "signup";



  await new Promise((resolve, reject) => {

  req.session.save((err) => {

    if (err) reject(err);

    else resolve();

  });

});

  console.log("OTP SAVED:", req.session.otp);

    await sendOtpEmail(email, otp);
    return { success: true };
  } catch (err) {
    console.log("❌ Email error:", err.message);
    return { success: false, message: "Could not send OTP. Check email address." };
  }
};

// VERIFY OTP
export const verifyOtpService = async (req) => {
  const { otp } = req.body;

  console.log("Stored OTP:", req.session.otp);
  console.log("Entered OTP:", otp);

  if (!req.session.otp) {
    return {
      success: false,
      errors: { otp: ["Session expired"] }
    };
  }

  if (Date.now() > req.session.otpExpiry) {
    return {
      success: false,
      errors: { otp: ["OTP expired"] }
    };
  }

  if (String(otp) !== String(req.session.otp)) {
    return {
      success: false,
      errors: { otp: ["Invalid OTP"] }
    };
  }

  // 🔥 RESET FLOW
  if (req.session.type === "reset") {
    return { success: true, redirect: "/reset-password" };
  }

  // 🔥 SIGNUP FLOW
  if (req.session.type === "signup") {
    const { name, email, password } = req.session.tempUser;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword
    });

    req.session.destroy();

    return { success: true, redirect: "/login" };
  }
};
// RESEND
export const resendOtpService = async (req) => {
  let email =
    req.session.type === "reset"
      ? req.session.resetEmail
      : req.session.tempUser?.email;

  if (!email) return { success: false };

  const otp = generateOTP();

  req.session.otp = otp;
  req.session.otpExpiry = Date.now() + 2 * 60 * 1000;

  console.log("NEW OTP SAVED:", otp);

  // ✅ FORCE SAVE SESSION
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await sendOtpEmail(email, otp);

  return { success: true };
};

// RESET
export const resetPasswordService = async (data, req) => {
  const { password, confirmPassword } = data;

  if (password !== confirmPassword) {
    return {
      success: false,
      errors: { confirmPassword: ["Passwords do not match"] }
    };
  }

  const email = req.session.resetEmail;

  const hashed = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate({ email }, { password: hashed });

  req.session.destroy();

  return { success: true };
};

export const loginService = async (data) => { // Removed 'req' as it's cleaner to handle session in controller
  try {
    const { email, password } = data;

    // 1. Check for empty fields
    if (!email || !password) {
      return { success: false, message: "Email and password are required", status: 400 };
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // 2. Check if user exists
    if (!user) {
      return { success: false, message: "User not found", status: 401 };
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Incorrect password", status: 401 };
    }

    // 4. Success - Return the user object so the controller can use it
    return { success: true, user };

  } catch (err) {
    console.error("Service Error:", err);
    throw err; // Let the controller catch the actual crash
  }
};
  