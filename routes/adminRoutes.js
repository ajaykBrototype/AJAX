import express from "express";
import {
  loadLogin,loginAdmin,logoutAdmin
} from "../controllers/admin/auth.controller.js";
import {
  loadCategoryPage,
  createCategory,
  getCategories,
  toggleCategory,
  deleteCategory
} from "../controllers/admin/category.controller.js";
import {getAllUsers,toggleBlockUser} from "../controllers/admin/user.controller.js";

import { isAdminAuth,isLoggedOut } from "../middleware/adminAuth.js";
import { noCache } from "../middleware/noCache.js";

const router = express.Router();

router.get("/login",isLoggedOut,noCache, loadLogin);
router.post("/login",isLoggedOut, loginAdmin);

router.get("/users",noCache, isAdminAuth, getAllUsers);
router.patch("/toggleblockuser/:id",toggleBlockUser);

router.get("/categories", isAdminAuth, loadCategoryPage);
router.get("/categories/all", isAdminAuth, getCategories);
router.post("/categories/add", isAdminAuth, createCategory);
router.patch("/categories/toggle/:id", isAdminAuth, toggleCategory);
router.delete("/categories/:id", isAdminAuth, deleteCategory);


router.get("/logout", logoutAdmin);

export default router;