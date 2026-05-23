import * as orderService from "../../services/admin/order.service.js";

export const loadAdminOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const currentStatus = req.query.status || "all";
        const page = parseInt(req.query.page) || 1;
        const limit = 8;

        const data = await orderService.getAdminOrdersService(searchQuery, currentStatus, page, limit);

        res.render("admin/orders", { 
            ...data,
            currentPath: "/admin/orders"
        });
    } catch (err) {
        console.log("ADMIN ORDER ERROR:", err);
        res.redirect("/admin/orders");
    }
};

export const loadOrderDetails = async (req, res) => {
    try {
        const order = await orderService.getOrderDetailsService(req.params.id);

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
        const result = await orderService.updateOrderStatusService(req.params.orderId, req.body.status);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};
