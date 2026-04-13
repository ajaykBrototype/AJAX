import User from "../models/user/userModel.js";

export const isLoggedIn =async (req, res, next) => {
     try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }

    if (user.isBlocked) {
      req.session.destroy();

      return res.redirect("/login?blocked=true");
    }

    next();

  } catch (err) {
    console.error(err);
    return res.redirect("/login");
  }
};

export const isLoggedOut = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect("/home");
    }
    return next();
};