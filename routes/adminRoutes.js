import express from "express";
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
import {loadSubCategoryPage,createSubCategory,updateSubCategory,deleteSubCategory,toggleSubCategory } from "../controllers/admin/subCategory.controller.js";

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
router.patch("/subcategories/toggle/:id", isAdminAuth, toggleSubCategory);




router.get("/logout", logoutAdmin);

export default router;