import express from "express";
import { upload } from "../middleware/upload.js";
import {
  loadLogin, loginAdmin, logoutAdmin
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

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.get("/login", isLoggedOut, noCache, loadLogin);
router.post("/login", isLoggedOut, loginAdmin);
router.get("/logout",isAdminAuth, logoutAdmin);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", noCache, isAdminAuth, getAllUsers);
router.patch("/toggleblockuser/:id", isAdminAuth, toggleBlockUser);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", isAdminAuth, loadCategoryPage);
router.get("/categories/all", isAdminAuth, getCategories);
router.post("/categories/add", isAdminAuth, createCategory);
router.patch("/categories/toggle/:id", isAdminAuth, toggleCategory); // specific before /:id
router.patch("/categories/:id", isAdminAuth, updateCategory);
router.delete("/categories/:id", isAdminAuth, deleteCategory);

// ─── Subcategories ────────────────────────────────────────────────────────────
router.get("/subcategories", isAdminAuth, loadSubCategoryPage);
router.post("/subcategories/add", isAdminAuth, createSubCategory);
router.get("/subcategories/by-category/:catId", isAdminAuth, getSubCategoriesByCategory); // specific before /:id
router.patch("/subcategories/toggle/:id", isAdminAuth, toggleSubCategory);                // specific before /:id
router.patch("/subcategories/:id", isAdminAuth, updateSubCategory);
router.delete("/subcategories/:id", isAdminAuth, deleteSubCategory);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get("/products", isAdminAuth, loadProductPage);
router.get("/products/add", isAdminAuth, loadAddProductPage);
router.post("/products/add", isAdminAuth, addProduct);

// Specific /products/something routes BEFORE /products/:id
router.get("/products/edit/:id", isAdminAuth, loadEditProductPage);
router.post("/products/edit/:id", isAdminAuth, updateProduct);
router.patch("/products/toggle/:id", isAdminAuth, toggleProduct);
router.delete("/products/delete/:id", isAdminAuth, deleteProduct);

// Variant edit routes (static segment "variants") BEFORE /products/:id
router.get("/products/variants/edit/:id", isAdminAuth, loadEditVariantPage);
router.post("/products/variants/edit/:id", isAdminAuth, upload.array("images", 5), updateVariant);

// Generic /products/:id AFTER all specific /products/... routes
router.get("/products/:id", isAdminAuth, loadProductDetails);

// Variant routes that use /:id/variants (safe — more segments, no conflict)
router.get("/products/:id/variants", isAdminAuth, loadVariantPage);
router.get("/products/:id/variants/add", isAdminAuth, loadAddVariantPage);
router.post("/products/:id/variants/add", isAdminAuth, upload.array("images", 5), addVariant);

// ─── Variants (standalone) ────────────────────────────────────────────────────
router.patch("/variants/toggle/:id", isAdminAuth, toggleVariantStatus);
router.patch("/variants/default/:id", isAdminAuth, setDefaultVariant);
router.delete("/variants/delete/:id", isAdminAuth, deleteVariant);

export default router;