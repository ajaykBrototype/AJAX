import User from "../../models/user/userModel.js";
import Order from "../../models/user/orderModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";

export const loadDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Total Earnings & Total Product Count (All items regardless of order status)
    const earningsData = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { 
          _id: null, 
          totalEarnings: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalProductCount: { $sum: "$items.quantity" }
      }}
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;
    const totalProductCount = earningsData.length > 0 ? earningsData[0].totalProductCount : 0;

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

    // --- MULTI-PERIOD SALES AGGREGATIONS (All Statuses, Sum of Item Values) ---
    
    // 1. TODAY (Hourly)
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const todayRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $hour: "$createdAt" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const todayData = Array.from({length: 6}, (_, i) => {
      const hour = (i + 1) * 4;
      const match = todayRaw.find(r => r._id >= hour - 4 && r._id < hour);
      return { label: `${hour > 12 ? hour-12 : hour}${hour >= 12 ? 'pm' : 'am'}`, value: match ? match.revenue : 0 };
    });

    // 2. WEEK (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
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
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
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
      { $match: { createdAt: { $gte: startOfYear } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearData = monthNames.map((name, i) => {
      const match = yearRaw.find(r => r._id === i + 1);
      return { label: name, value: match ? match.revenue : 0 };
    });

    const chartData = { today: todayData, week: weekData, month: monthData, year: yearData };

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
    const outOfStockCount = await Variant.countDocuments({ stock: 0 });
    const lowStockCount = await Variant.countDocuments({ stock: { $gt: 0, $lte: 10 } });
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const orderStatusCounts = { Delivered: 0, Pending: 0, Cancelled: 0, Returned: 0, Placed: 0, Confirmed: 0, Processing: 0, Shipped: 0 };
    statusCounts.forEach(s => { orderStatusCounts[s._id] = s.count; });

    res.render("admin/dashboard", {
      stats: { totalUsers, totalOrders: totalProductCount, totalProducts, totalRevenue: totalEarnings },
      recentOrders, popularProducts, subcategorySales, chartData, topProduct,
      inventoryStats: { outOfStock: outOfStockCount, lowStock: lowStockCount },
      orderStatusCounts
    });
  } catch (err) {
    console.log("LOAD DASHBOARD ERROR:", err);
    res.redirect("/admin/dashboard");
  }
};

export const loadSalesReport = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let startDate = new Date();
    let prevStartDate = new Date();
    const endDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setFullYear(startDate.getFullYear() - 1);
    }

    const getStats = async (start, end) => {
      const stats = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $nin: ['Cancelled'] } }},
        { $unwind: "$items" },
        { $match: { "items.status": { $nin: ['Cancelled', 'Returned'] } } },
        { $group: {
            _id: null,
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            orders: { $addToSet: "$_id" },
            products: { $sum: "$items.quantity" }
        }},
        { $project: {
            revenue: 1,
            orderCount: { $size: "$orders" },
            productCount: "$products"
        }}
      ]);
      return stats[0] || { revenue: 0, orderCount: 0, productCount: 0 };
    };

    const currentStats = await getStats(startDate, endDate);
    const previousStats = await getStats(prevStartDate, startDate);

    const revenueOverviewRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['Cancelled'] } }},
      { $unwind: "$items" },
      { $match: { "items.status": { $nin: ['Cancelled', 'Returned'] } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing dates for "up and downs"
    const revenueOverview = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const match = revenueOverviewRaw.find(d => d._id === dateStr);
      revenueOverview.push({ _id: dateStr, revenue: match ? match.revenue : 0 });
      current.setDate(current.getDate() + 1);
    }

    const couponUsage = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, couponCode: { $ne: null } }},
      { $group: { _id: "$couponCode", count: { $sum: 1 }, discount: { $sum: "$discount" } }},
      { $limit: 5 }
    ]);

    const orderBreakdown = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).limit(5);

    res.render("admin/salesReport", {
      currentPath: "/admin/sales-report",
      period,
      stats: currentStats,
      previousStats,
      revenueOverview,
      couponUsage,
      orderBreakdown,
      startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  } catch (err) {
    console.log("LOAD SALES REPORT ERROR:", err);
    res.redirect("/admin/dashboard");
  }
};