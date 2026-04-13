import Admin from "../models/admin/adminModel.js";
export const isAdminAuth = async(req, res, next) => {
  try {
    if (!req.session.adminId) {
      return res.redirect("/admin/login");
    }

    const admin = await Admin.findById(req.session.adminId);

    if (!admin) {
      req.session.destroy();
      return res.redirect("/admin/login");
    }
    next();

  } catch (err) {
    console.error(err);
    return res.redirect("/admin/login");
  }
};


export const isLoggedOut = (req, res, next) => {
    if (req.session.adminId) {
        return res.redirect("/admin/users");
    }
    return next();
};