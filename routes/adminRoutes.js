import express from "express";
import {
  loadLogin,
  loginAdmin,
  logoutAdmin
} from "../controllers/admin/auth.controller.js";
import {getAllUsers,toggleBlockUser} from "../controllers/admin/user.controller.js";

import { isAdminAuth,isLoggedOut } from "../middleware/adminAuth.js";
import { noCache } from "../middleware/noCache.js";

const router = express.Router();

router.get("/login",isLoggedOut,noCache, loadLogin);
router.post("/login",isLoggedOut, loginAdmin);

router.get("/users",noCache, isAdminAuth, getAllUsers);
router.patch("/toggleblockuser/:id",toggleBlockUser)


router.get("/logout", logoutAdmin);

export default router;