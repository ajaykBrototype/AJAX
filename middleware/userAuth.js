import User from "../models/user/userModel.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      delete req.session.userId; 

      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(401).json({
          success: false,
          message: "Session expired"
        });
      }

      return res.redirect("/login");
    }


    if (user.isBlocked) {
      delete req.session.userId; 

      if (req.xhr || req.headers.accept.includes("json")) {
        return res.status(403).json({
          success: false,
          message: "User is blocked"
        });
      }

      return res.redirect("/login?blocked=true");
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

    return res.redirect("/login");
  }
};

export const isLoggedOut = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect("/home");
    }
    return next();
};