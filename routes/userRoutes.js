import express from "express";
import passport from "passport";

import * as authController from "../controllers/user/auth.controller.js";
import * as profileController from "../controllers/user/profile.controller.js";
import * as emailController from "../controllers/user/email.controller.js";
import * as addressController from "../controllers/user/address.controller.js";

import { isLoggedIn, isLoggedOut, checkBlocked } from "../middleware/userAuth.js";
import { upload } from "../middleware/upload.js";
import { noCache } from "../middleware/noCache.js";
import { loadMenPage,loadProductDetails,checkQuantity,loadFilteredProducts } from "../controllers/user/product.controller.js";
import {loadCartPage,addToCart,updateCartQty,removeCartItem  } from "../controllers/user/cart.controller.js";
import {loadWishlistPage,toggleWishlist,clearAllWishlist,getWishlistCount,addToBagFromWishlist  } from "../controllers/user/wishlist.controller.js";

const router = express.Router();
router.use(checkBlocked);


router.get("/signup", noCache, isLoggedOut, authController.loadSignup);
router.post("/signup", authController.registerUser);

router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  authController.googleCallback 
);

router.get("/otp", authController.loadOtpPage);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);

router.get("/login", noCache, isLoggedOut, authController.loadLogin);
router.post("/login", isLoggedOut, authController.loginUser);

router.get("/logout", noCache, authController.logoutUser);


router.get("/forgot-password", authController.loadForgotPassword);
router.post("/forgot-password", authController.forgotPassword);

router.get("/reset-password", authController.loadResetPassword);
router.post("/reset-password", authController.resetPassword);


router.get("/home", authController.loadHome);
router.get("/", authController.loadHome);


router.get("/profile", noCache, isLoggedIn, profileController.loadProfile);
router.get("/edit-profile", noCache, isLoggedIn, profileController.loadEditProfile);

router.patch( "/profile/update", isLoggedIn, upload.single("profileImage"), profileController.updateProfile);

router.get("/profile/email/verify", isLoggedIn, emailController.loadVerifyEmailPage);
router.post("/profile/email/verify", isLoggedIn, emailController.verifyEmailOtp);
router.post("/profile/email/resend-otp", isLoggedIn, emailController.resendEmailOtp);

router.get("/change-password", noCache, isLoggedIn, profileController.loadChangePassword);
router.post("/change-password", isLoggedIn, profileController.changePassword);


router.get("/address", noCache, isLoggedIn, addressController.loadAddressPage);
router.get("/add-address", noCache, isLoggedIn, addressController.loadAddAddressPage);
router.post("/address/add", isLoggedIn, addressController.addAddress);
router.delete("/address/:id", isLoggedIn, addressController.deleteAddress);

router.get("/edit-address/:id", noCache, isLoggedIn, addressController.loadEditAddressPage);
router.put("/edit-address/:id", isLoggedIn, addressController.updateAddress);

router.get("/menProductList",loadMenPage);
router.get("/api/products",loadFilteredProducts);

router.get("/product/:id", loadProductDetails);
router.post("/check-quantity", checkQuantity);
router.post("/cart/add", isLoggedIn, addToCart);
router.get("/cart", isLoggedIn, loadCartPage);
router.patch("/cart/update", isLoggedIn, updateCartQty);
router.post("/cart/remove", isLoggedIn, removeCartItem);

router.get("/wishlist", isLoggedIn, loadWishlistPage);
router.get("/wishlist/count", isLoggedIn, getWishlistCount);
router.post("/wishlist/add", isLoggedIn, toggleWishlist);
router.post("/cart/add-from-wishlist", isLoggedIn, addToBagFromWishlist);
router.delete("/wishlist/clear", isLoggedIn, clearAllWishlist);
export default router;