import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    console.log("EMAIL USER:", process.env.EMAIL_USER);
    console.log("EMAIL PASS:", process.env.EMAIL_PASS ? "Exists" : "Missing");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP",
      html: `
        <h2>OTP:</h2>
        <h1>${otp}</h1>
        <p>This OTP is valid for 2 minutes</p>
      `,
    };

    // ✅ THIS LINE WAS MISSING
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);

  } catch (err) {
    console.log("❌ Email error:", err);
  }
};