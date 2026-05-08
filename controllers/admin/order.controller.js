import Order from "../../models/user/orderModel.js";
import User from "../../models/user/userModel.js";
import Variant from "../../models/admin/variantModel.js";




export const loadAdminOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const currentStatus = req.query.status || "all";
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

        if (currentStatus && currentStatus !== "all") {
            // Map simple status to actual DB status if needed
            const statusMap = {
                'pending': 'Pending',
                'placed': 'Placed',
                'confirmed': 'Confirmed',
                'shipped': 'Shipped',
                'delivered': 'Delivered',
                'cancelled': 'Cancelled'
            };
            filter.status = statusMap[currentStatus] || currentStatus;
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
            currentStatus,
            currentPath: "/admin/orders"
        });

    } catch (err) {
        console.log("ADMIN ORDER ERROR:", err);
        res.redirect("/admin/orders");
    }
};

export const loadOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate("userId", "name email phone")
            .exec();

        if (!order) {
            return res.redirect("/admin/orders");
        }

        res.render("admin/orderDetails", { 
            order,
            currentPath: "/admin/orders"
        });

    } catch (err) {
        console.log("ADMIN ORDER DETAILS ERROR:", err);
        res.redirect("/admin/orders");
    }
};

export const updateOrderStatus = async (req, res) => {
    try {

        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        const statusFlow=[
            "Placed",
            "Confirmed",
            "Processing",
            "Shipped",
            "Out for Delivery",
            "Delivered"
        ];

        const currentIndex=statusFlow.indexOf(order.status);
        const newIndex=statusFlow.indexOf(status);

        if(order.status===status){
             return res.status(400).json({
                success: false,
                message: "Status already updated"
            });
        }

        if(newIndex!==currentIndex+1){
            if(status!=="Cancelled"){
                   return res.status(400).json({
                    success: false,
                    message: `Order must move to ${
                        statusFlow[currentIndex + 1]
                    } first`
                });
            }
        }

         if (order.status === "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Delivered order cannot be changed"
            });
        }

         if (order.status === "Cancelled") {

            return res.status(400).json({
                success: false,
                message: "Order already cancelled"
            });

        }
        

        if(status==="Cancelled"){
            for(const item of order.items){
                const variant=await Variant.findById(
                    item.variantId
                );

                if(variant){
                    variant.stock+=item.quantity;

                    await variant.save();
                }
            }
        }


        order.status = status;

        order.statusHistory.push({
            status,
            updatedAt: new Date()
        });

        await order.save();

        res.json({
            success: true
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });

    }
};

