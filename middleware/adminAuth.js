import Admin from "../models/admin/adminModel.js";
export const isAdminAuth = async (req, res, next) => {
  try {
    if (!req.session.adminId) {
      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      return res.redirect("/admin/login");
    }

    const admin = await Admin.findById(req.session.adminId);

    if (!admin) {
      req.session.destroy();

      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(401).json({
          success: false,
          message: "Session expired"
        });
      }

      return res.redirect("/admin/login");
    }

    next();

  } catch (err) {
    console.error(err);

    if (req.xhr || req.headers.accept.includes("json")) {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }

    return res.redirect("/admin/login");
  }
};


export const isLoggedOut = (req, res, next) => {
    if (req.session.adminId) {
        return res.redirect("/admin/users");
    }
    return next();
};