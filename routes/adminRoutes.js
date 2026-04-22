import express from "express";
import { upload } from "../middleware/upload.js";
import {
  loadLogin,loginAdmin,logoutAdmin
} from "../controllers/admin/auth.controller.js";
import {
  loadCategoryPage,createCategory,getCategories,
  toggleCategory,deleteCategory, updateCategory
} from "../controllers/admin/category.controller.js";

import {getAllUsers,toggleBlockUser} from "../controllers/admin/user.controller.js";

import { isAdminAuth,isLoggedOut } from "../middleware/adminAuth.js";
import { noCache } from "../middleware/noCache.js";
import {
  loadSubCategoryPage,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategory,
  getSubCategoriesByCategory 
} from "../controllers/admin/subCategory.controller.js";
import { loadAddProductPage, loadProductPage,addProduct, toggleProduct,loadProductDetails,loadEditProductPage,updateProduct,deleteProduct } from "../controllers/admin/product.controller.js";
import { loadVariantPage,loadAddVariantPage,addVariant,toggleVariantStatus,deleteVariant } from "../controllers/admin/variant.controller.js";

const router = express.Router();

router.get("/login",isLoggedOut,noCache, loadLogin);
router.post("/login",isLoggedOut, loginAdmin);

router.get("/users",noCache, isAdminAuth, getAllUsers);
router.patch("/toggleblockuser/:id",toggleBlockUser);

router.get("/categories", isAdminAuth, loadCategoryPage);
router.get("/categories/all", isAdminAuth, getCategories);
router.post("/categories/add", isAdminAuth, createCategory);
router.patch("/categories/:id", isAdminAuth, updateCategory);
router.patch("/categories/toggle/:id", isAdminAuth, toggleCategory);
router.delete("/categories/:id", isAdminAuth, deleteCategory);

router.get("/subcategories", isAdminAuth, loadSubCategoryPage);
router.post("/subcategories/add",isAdminAuth,createSubCategory);
router.patch("/subcategories/:id", isAdminAuth, updateSubCategory);
router.delete("/subcategories/:id", isAdminAuth, deleteSubCategory);
router.get("/subcategories/by-category/:catId", isAdminAuth, getSubCategoriesByCategory);
router.patch("/subcategories/toggle/:id", isAdminAuth, toggleSubCategory);

router.get("/products", isAdminAuth,loadProductPage);
router.get("/products/add", isAdminAuth,loadAddProductPage);
router.post("/products/add", isAdminAuth, addProduct);
router.patch("/products/toggle/:id", isAdminAuth, toggleProduct);
router.get('/products/edit/:id', isAdminAuth,loadEditProductPage);
router.post('/products/edit/:id', isAdminAuth,updateProduct);
router.delete("/products/delete/:id",isAdminAuth, deleteProduct);

router.get("/products/:id", isAdminAuth, loadProductDetails);

router.get("/products/:id/variants", loadVariantPage);
router.get("/products/:id/variants/add",isAdminAuth,loadAddVariantPage);
router.post("/products/:id/variants/add",isAdminAuth,  upload.array("images", 5),addVariant);
router.patch("/variants/toggle/:id",isAdminAuth, toggleVariantStatus);
router.delete("/variants/delete/:id", isAdminAuth, deleteVariant);

router.get("/logout", logoutAdmin);

export default router;