import * as adminService from "../../services/admin/auth.service.js";
import { adminLoginSchema } from "../../validators/adminValidator.js";

export const loadLogin = (req, res) => {
  res.render("admin/login");
};

export const loginAdmin = async (req, res) => {
  try {
    const result=adminLoginSchema.safeParse(req.body);
    if(!result.success){
      return res.status(400).json({
        success:false,
        errors:result.error.flatten().fieldErrors
      });
    }
    const { email, password } = result.data;
    const admin = await adminService.loginAdminService(email, password);

    req.session.adminId = admin._id;
    console.log("SESSION SAVED:", req.session.adminId);

    req.session.save((err) => {
      if(err) console.log("Session Save Error:", err);
      res.json({ success: true, redirect: "/admin/users" });
    });

  } catch (err) {
    let errors = {};

    if (err.message.includes("email")) {
      errors.email = [err.message];
    } else if (err.message.includes("password")) {
      errors.password = [err.message];
    } else {
      errors.general = [err.message];
    }

    return res.status(401).json({
      success: false,
      errors
    });
  }
};
// export const loadDashboard = (req, res) => {
//   res.render("admin/users"); // 
// };

export const logoutAdmin = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};