import * as adminService from "../../services/admin/auth.service.js";
import { adminLoginSchema } from "../../validators/adminValidator.js";
import User from "../../models/user/userModel.js";
import Order from "../../models/user/orderModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";

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

    // Subcategory sales aggregation
    const subcategorySales = await Order.aggregate([
      { $unwind: "$items" },
      { $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
      }},
      { $unwind: "$product" },
      { $lookup: {
          from: "subcategories",
          localField: "product.subcategory",
          foreignField: "_id",
          as: "subcat"
      }},
      { $unwind: "$subcat" },
      { $group: {
          _id: "$subcat._id",
          name: { $first: "$subcat.name" },
          totalSold: { $sum: "$items.quantity" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 4 }
    ]);

    const topProduct = popularProducts.length > 0 ? popularProducts[0] : null;

    // Inventory Alerts
    const outOfStockCount = await Variant.countDocuments({ stock: 0 });
    const lowStockCount = await Variant.countDocuments({ stock: { $gt: 0, $lte: 10 } });

    // Order Status Distribution
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const orderStatusCounts = {
      Delivered: 0,
      Pending: 0,
      Cancelled: 0,
      Returned: 0
    };

    statusCounts.forEach(s => {
      if (orderStatusCounts.hasOwnProperty(s._id)) {
        orderStatusCounts[s._id] = s.count;
      }
    });

    res.render("admin/dashboard", {
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue
      },
      recentOrders,
      popularProducts,
      subcategorySales,
      topProduct,
      inventoryStats: {
        outOfStock: outOfStockCount,
        lowStock: lowStockCount
      },
      orderStatusCounts
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