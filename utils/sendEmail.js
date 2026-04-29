import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp, useCase = "default") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = "Your AJAX OTP Code";
    let description = "Use the OTP below to proceed.";

    if (useCase === "signup") {
      subject = "Verify Your AJAX Account";
      description = "Welcome to AJAX! Please use the OTP below to verify your email address and complete your registration.";
    } else if (useCase === "reset") {
      subject = "Password Reset Request";
      description = "We received a request to reset your password. Use the OTP below to securely reset it. If you didn't make this request, please ignore this email.";
    } else if (useCase === "verify_email") {
      subject = "Verify Your Email Update";
      description = "You requested to update your email address. Please use the OTP below to confirm this change.";
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; margin: 0; }
          .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #eaeaea; text-align: center; }
          .logo { font-family: 'Georgia', serif; font-size: 24px; letter-spacing: 4px; color: #111111; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: 500; color: #333333; margin-bottom: 15px; }
          .desc { font-size: 14px; color: #666666; line-height: 1.6; margin-bottom: 30px; }
          .otp-container { background-color: #1a1a1a; padding: 20px; border-radius: 6px; margin: 0 auto 30px; display: inline-block; }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; margin: 0; font-family: monospace; }
          .note { font-size: 12px; color: #999999; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 20px; }
          .footer { font-size: 11px; color: #cccccc; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">AJAX</div>
          <div class="title">${subject}</div>
          <div class="desc">${description}</div>
          
          <div class="otp-container">
            <p class="otp">${otp}</p>
          </div>
          
          <div style="font-size: 13px; color: #555;">(Select and copy the code above)</div>
          
          <div class="note">This OTP is valid for exactly 2 minutes. Do not share this code with anyone.</div>
          <div class="footer">&copy; ${new Date().getFullYear()} AJAX. All rights reserved.</div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"AJAX Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.log("❌ Email error:", err);
  }
};