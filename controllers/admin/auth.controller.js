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

    // --- MULTI-PERIOD SALES AGGREGATIONS (Delivered Only) ---
    
    // 1. TODAY (Hourly)
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const todayRaw = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfToday } } },
      { $group: {
          _id: { $hour: "$createdAt" },
          revenue: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const todayData = Array.from({length: 6}, (_, i) => {
      const hour = (i + 1) * 4; // 4am, 8am, 12pm, 4pm, 8pm, 12am
      const match = todayRaw.find(r => r._id >= hour - 4 && r._id < hour);
      return { label: `${hour > 12 ? hour-12 : hour}${hour >= 12 ? 'pm' : 'am'}`, value: match ? match.revenue : 0 };
    });

    // 2. WEEK (Last 7 Days - Already implemented but naming it for clarity)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekRaw = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const weekData = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = weekRaw.find(s => s._id === dateStr);
      weekData.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: match ? match.revenue : 0 });
    }

    // 3. MONTH (Weeks of current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthRaw = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfMonth } } },
      { $group: {
          _id: { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
          revenue: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const monthData = Array.from({length: 4}, (_, i) => {
      const match = monthRaw.find(r => r._id === i + 1);
      return { label: `Week ${i + 1}`, value: match ? match.revenue : 0 };
    });

    // 4. YEAR (Months of current year)
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    const yearRaw = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfYear } } },
      { $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearData = monthNames.map((name, i) => {
      const match = yearRaw.find(r => r._id === i + 1);
      return { label: name, value: match ? match.revenue : 0 };
    });

    const chartData = { today: todayData, week: weekData, month: monthData, year: yearData };

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
      chartData,
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