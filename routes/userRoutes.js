import express from "express";
import passport from "passport";
import {
  loadSignup,registerUser,
  verifyOtp,resendOtp,
  forgotPassword,resetPassword,
  loadLogin,loginUser,logoutUser
} from "../controllers/user/auth.controller.js";

import {
  loadEditProfile,
  loadProfile,updateProfile,changePassword,
  loadChangePassword
} from "../controllers/user/profile.controller.js";

import { loadAddressPage,loadAddAddressPage,deleteAddress,addAddress,loadEditAddressPage,updateAddress} from "../controllers/user/address.controller.js";


import { isLoggedIn, isLoggedOut } from "../middleware/userAuth.js";
import { upload } from "../middleware/upload.js";
import { noCache } from "../middleware/noCache.js";

const router = express.Router();

router.get("/signup",noCache, isLoggedOut, loadSignup);
router.post("/signup", registerUser);

router.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

// 🔥 CALLBACK
router.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    req.session.userId = req.user._id;
    res.redirect("/home");
  }
);



router.get("/otp", (req, res) => {

  return res.render("user/otp"); 
});
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/login", noCache,isLoggedOut, loadLogin);
router.post("/login", isLoggedOut, loginUser); // Added isLoggedOut to POST too
router.get("/logout",noCache, logoutUser);

router.get("/forgot-password", (req, res) => {
  // Prevent crash during session destroy
  req.session.destroy((err) => {
    return res.render("user/forgotPassword");
  });
});
router.post("/forgot-password", forgotPassword);

router.get("/reset-password", (req, res) => {
  if (!req.session.resetEmail) {
    return res.redirect("/forgot-password"); 
  }
  return res.render("user/resetPassword"); 
})

router.post("/reset-password", resetPassword);


router.get("/home", isLoggedIn, (req, res) => {
  return res.render("user/home"); 
});

router.get("/profile",noCache, isLoggedIn, loadProfile);
router.get("/edit-profile",noCache, isLoggedIn, loadEditProfile);
router.post("/profile/update", isLoggedIn, upload.single("profileImage"), updateProfile);

router.get("/change-password",noCache, isLoggedIn, loadChangePassword);
router.post("/change-password", isLoggedIn, changePassword);

router.get("/address",noCache, isLoggedIn, loadAddressPage);
router.get("/add-address",noCache, isLoggedIn, loadAddAddressPage);
router.post("/address/add", isLoggedIn, addAddress); // Added isLoggedIn
router.delete("/address/:id", isLoggedIn, deleteAddress); // Added isLoggedIn

router.get("/edit-address/:id",noCache, isLoggedIn, loadEditAddressPage);
router.post("/edit-address/:id", isLoggedIn, updateAddress); // Added isLoggedIn

export default router;