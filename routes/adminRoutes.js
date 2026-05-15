import express from "express";
import { upload } from "../middleware/upload.js";
import {
  loadLogin, loginAdmin, logoutAdmin, loadDashboard
} from "../controllers/admin/auth.controller.js";
import {
  loadCategoryPage, createCategory, getCategories,
  toggleCategory, deleteCategory, updateCategory
} from "../controllers/admin/category.controller.js";
import { getAllUsers, toggleBlockUser } from "../controllers/admin/user.controller.js";
import { isAdminAuth, isLoggedOut } from "../middleware/adminAuth.js";
import { noCache } from "../middleware/noCache.js";
import {
  loadSubCategoryPage,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategory,
  getSubCategoriesByCategory
} from "../controllers/admin/subCategory.controller.js";
import {
  loadAddProductPage, loadProductPage, addProduct, toggleProduct,
  loadProductDetails, loadEditProductPage, updateProduct, deleteProduct
} from "../controllers/admin/product.controller.js";
import {
  loadVariantPage, loadAddVariantPage, addVariant, toggleVariantStatus,
  loadEditVariantPage, updateVariant, deleteVariant, setDefaultVariant
} from "../controllers/admin/variant.controller.js";
import { loadAdminOrders, loadOrderDetails,updateOrderStatus } from "../controllers/admin/order.controller.js";
import { loadReturnManagement, loadReturnDetails,approveReturn,rejectReturn,schedulePickup,markPickedUp } from "../controllers/admin/return.controller.js";
import { loadCouponPage,createCoupon,updateCoupon,toggleCouponStatus,deleteCoupon,getSingleCoupon } from "../controllers/admin/coupon.controller.js";
import { createOffer, loadCreateOffer, loadOffers,updateOffer,deleteOffer,toggleOfferStatus } from "../controllers/admin/offer.controller.js";


const router = express.Router();


router.get("/login", isLoggedOut, noCache, loadLogin);
router.post("/login", isLoggedOut, loginAdmin);
router.get("/logout",isAdminAuth, logoutAdmin);

router.get("/", isAdminAuth, (req, res) => res.redirect("/admin/dashboard"));
router.get("/dashboard", isAdminAuth, noCache, loadDashboard);

router.get("/users", noCache, isAdminAuth, getAllUsers);
router.patch("/toggleblockuser/:id", isAdminAuth, toggleBlockUser);


router.get("/orders", noCache, isAdminAuth, loadAdminOrders);
router.get("/orders/:id", noCache, isAdminAuth, loadOrderDetails);
router.patch("/orders/:orderId/status",isAdminAuth, updateOrderStatus);


router.get("/returns", noCache, isAdminAuth, loadReturnManagement);
router.get("/returns/:id", noCache, isAdminAuth, loadReturnDetails);
router.patch("/returns/:id/approve",approveReturn);
router.patch("/returns/:id/reject",rejectReturn);
router.patch("/returns/:id/schedule-pickup",schedulePickup);
router.patch("/returns/:id/picked-up",markPickedUp);

router.get("/coupons", noCache, isAdminAuth, loadCouponPage);
router.post("/coupons/create",isAdminAuth, createCoupon);
router.put("/coupons/update/:id",isAdminAuth,updateCoupon);
router.patch("/coupons/toggle/:id",isAdminAuth, toggleCouponStatus);
router.delete("/coupons/delete/:id",isAdminAuth, deleteCoupon);
router.get("/coupons/get-coupon/:id",isAdminAuth,getSingleCoupon);

router.get("/offers",isAdminAuth,loadOffers);
router.get("/offers/create",isAdminAuth,loadCreateOffer);
router.post("/offers/create",isAdminAuth,createOffer);
router.put("/offers/update",isAdminAuth,updateOffer);
router.patch("/offers/delete/:id", isAdminAuth, deleteOffer);
router.patch("/offers/toggle-status/:id",isAdminAuth,toggleOfferStatus);

router.get("/categories", isAdminAuth, loadCategoryPage);
router.get("/categories/all", isAdminAuth, getCategories);
router.post("/categories/add", isAdminAuth, createCategory);
router.patch("/categories/toggle/:id", isAdminAuth, toggleCategory); // specific before /:id
router.patch("/categories/:id", isAdminAuth, updateCategory);
router.delete("/categories/:id", isAdminAuth, deleteCategory);


router.get("/subcategories", isAdminAuth, loadSubCategoryPage);
router.post("/subcategories/add", isAdminAuth, createSubCategory);
router.get("/subcategories/by-category/:catId", isAdminAuth, getSubCategoriesByCategory); // specific before /:id
router.patch("/subcategories/toggle/:id", isAdminAuth, toggleSubCategory);                // specific before /:id
router.patch("/subcategories/:id", isAdminAuth, updateSubCategory);
router.delete("/subcategories/:id", isAdminAuth, deleteSubCategory);


router.get("/products", isAdminAuth, loadProductPage);
router.get("/products/add", isAdminAuth, loadAddProductPage);
router.post("/products/add", isAdminAuth, upload.array("images", 5), addProduct);


router.get("/products/edit/:id", isAdminAuth, loadEditProductPage);
router.post("/products/edit/:id", isAdminAuth, updateProduct);
router.patch("/products/toggle/:id", isAdminAuth, toggleProduct);
router.delete("/products/delete/:id", isAdminAuth, deleteProduct);


router.get("/products/variants/edit/:id", isAdminAuth, loadEditVariantPage);
router.post("/products/variants/edit/:id", isAdminAuth, upload.array("images", 5), updateVariant);


router.get("/products/:id", isAdminAuth, loadProductDetails);


router.get("/products/:id/variants", isAdminAuth, loadVariantPage);
router.get("/products/:id/variants/add", isAdminAuth, loadAddVariantPage);
router.post("/products/:id/variants/add", isAdminAuth, upload.array("images", 5), addVariant);

router.patch("/variants/toggle/:id", isAdminAuth, toggleVariantStatus);
router.patch("/variants/default/:id", isAdminAuth, setDefaultVariant);
router.delete("/variants/delete/:id", isAdminAuth, deleteVariant);

export default router;