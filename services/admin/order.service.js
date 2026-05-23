import Order from "../../models/user/orderModel.js";
import User from "../../models/user/userModel.js";
import Variant from "../../models/admin/variantModel.js";
import Wallet from "../../models/user/walletModel.js";

export const getAdminOrdersService = async (searchQuery, currentStatus, page, limit) => {
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

    return {
        orders,
        stats: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
        searchQuery,
        currentPage: page,
        totalPages,
        totalFilteredOrders,
        currentStatus
    };
};

export const getOrderDetailsService = async (orderId) => {
    return await Order.findById(orderId).populate("userId", "name email phone").exec();
};

export const updateOrderStatusService = async (orderId, status) => {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, statusCode: 404, message: "Order not found" };

    const statusFlow = ["Placed", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
    const currentIndex = statusFlow.indexOf(order.status);
    const newIndex = statusFlow.indexOf(status);

    if (order.status === status) return { success: false, statusCode: 400, message: "Status already updated" };

    if (newIndex !== currentIndex + 1) {
        if (status !== "Cancelled") {
            return { success: false, statusCode: 400, message: `Order must move to ${statusFlow[currentIndex + 1]} first` };
        }
    }

    if (order.status === "Delivered") return { success: false, statusCode: 400, message: "Delivered order cannot be changed" };
    if (order.status === "Cancelled") return { success: false, statusCode: 400, message: "Order already cancelled" };

    if (status === "Cancelled") {
        for (const item of order.items) {
            if (item.status !== "Cancelled" && item.status !== "Returned") {
                const variant = await Variant.findById(item.variantId);
                if (variant) {
                    variant.stock += item.quantity;
                    await variant.save();
                }
                item.status = "Cancelled";
            }
        }

        if (order.paymentMethod !== "COD" && order.status !== "Pending" && order.totalAmount > 0) {
            let wallet = await Wallet.findOne({ userId: order.userId });

            if (!wallet) {
                wallet = await Wallet.create({
                    userId: order.userId,
                    balance: 0,
                    transactions: []
                });
            }

            wallet.balance += order.totalAmount;
            wallet.transactions.push({
                transactionId: "REF" + Date.now(),
                orderId: order._id,
                type: "credit",
                amount: order.totalAmount,
                description: "Refund for order cancelled by admin",
                date: new Date()
            });

            await wallet.save();
        }
    }

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });
    await order.save();

    return { success: true, statusCode: 200 };
};
