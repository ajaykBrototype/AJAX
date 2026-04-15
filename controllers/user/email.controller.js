import { verifyEmailOtpService, resendEmailOtpService } from "../../services/user/email.service.js";

export const verifyEmailOtp = async (req, res) => {
  try {
    const result = await verifyEmailOtpService(req);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendEmailOtp = async (req, res) => {
  try {
    const result = await resendEmailOtpService(req);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};