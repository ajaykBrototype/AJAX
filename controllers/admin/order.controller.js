import Order from "../../models/user/orderModel.js";
import User from "../../models/user/userModel.js";

export const loadAdminOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let filter = {};
        if (searchQuery) {
            
            filter = {
                $or: [
                    { "address.name": { $regex: searchQuery, $options: "i" } },
                    { "address.phone": { $regex: searchQuery, $options: "i" } }
                ]
            };
            
           
            if (searchQuery.match(/^[0-9a-fA-F]{24}$/)) {
                filter.$or.push({ _id: searchQuery });
            }
        }

        const [orders, totalOrders, pendingOrders, completedOrders, totalFilteredOrders] = await Promise.all([
            Order.find(filter)
                .populate("userId", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(),
            Order.countDocuments({ status: { $in: ["Pending", "Placed"] } }),
            Order.countDocuments({ status: "Delivered" }),
            Order.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalFilteredOrders / limit);

        res.render("admin/orders", { 
            orders,
            stats: {
                total: totalOrders,
                pending: pendingOrders,
                completed: completedOrders
            },
            searchQuery,
            currentPage: page,
            totalPages,
            totalFilteredOrders,
            currentPath: "/admin/orders"
        });

    } catch (err) {
        console.log("ADMIN ORDER ERROR:", err);
        res.redirect("/admin");
    }
};