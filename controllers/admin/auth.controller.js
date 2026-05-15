import * as adminService from "../../services/admin/auth.service.js";
import { adminLoginSchema } from "../../validators/adminValidator.js";
import User from "../../models/user/userModel.js";
import Order from "../../models/user/orderModel.js";
import Product from "../../models/admin/productModel.js";

export const loadLogin = (req, res) => {
  res.render("admin/login");
};

export const loginAdmin = async (req, res) => {
  try {
    const result=adminLoginSchema.safeParse(req.body);
    if(!result.success){
      return res.status(400).json({
        success:false,
        errors:result.error.flatten().fieldErrors
      });
    }
    const { email, password } = result.data;
    const admin = await adminService.loginAdminService(email, password);

    req.session.adminId = admin._id;
    console.log("SESSION SAVED:", req.session.adminId);

    req.session.save((err) => {
      if(err) console.log("Session Save Error:", err);
      res.json({ success: true, redirect: "/admin/users" });
    });

  } catch (err) {
    let errors = {};

    if (err.message.includes("email")) {
      errors.email = [err.message];
    } else if (err.message.includes("password")) {
      errors.password = [err.message];
    } else {
      errors.general = [err.message];
    }

    return res.status(401).json({
      success: false,
      errors
    });
  }
};
export const loadDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const popularProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.render("admin/dashboard", {
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue
      },
      recentOrders,
      popularProducts
    });
  } catch (err) {
    console.log("LOAD DASHBOARD ERROR:", err);
    res.redirect("/admin/users");
  }
};

export const logoutAdmin = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
};