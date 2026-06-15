import * as orderService from "../../services/user/order.service.js";
import Order from "../../models/user/orderModel.js"; 

export const loadOrderPage = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.render("user/orderSuccess", { order });
    } catch (err) {
        console.log("ORDER PAGE ERROR:", err);
        res.redirect("/home");
    }
};

export const loadPaymentFailure = async (req, res) => {
    try {
        const order = await Order.findById(req.query.orderId);
        res.render("user/paymentFailure", { order, message: req.query.message });
    } catch (err) {
        console.log("PAYMENT FAILURE PAGE ERROR:", err);
        res.redirect("/checkout");
    }
};

export const loadOrdersList = async (req, res) => {
    try {
        const result = await orderService.getOrdersListService(req.session.userId, req.query.search, req.query.sort);
        res.render("user/orders", { user: result.user, orders: result.orders, activePage: "orders" });
    } catch (err) {
        console.log("LOAD ORDERS ERROR:", err);
        res.redirect("/men-product-list");
    }
};

export const loadOrderDetails = async (req, res) => {
    try {
        const data = await orderService.getOrderDetailsService(req.session.userId, req.params.id);
        if (!data) return res.redirect("/orders");
        res.render("user/orderDetails", data);
    } catch (err) {
        console.log("LOAD ORDER DETAILS ERROR:", err);
        res.redirect("/orders");
    }
};

export const placeOrder = async (req, res) => {
    try {
        const result = await orderService.placeOrderService(req.session.userId, req.body);
        res.json(result);
    } catch (err) {
        console.log("ORDER ERROR FULL:", err);
        res.json({ success: false, message: err.message });
    }
};

export const verifyOrderPayment = async (req, res) => {
    try {
        const result = await orderService.verifyOrderPaymentService(req.session.userId, req.body);
        res.json(result);
    } catch (err) {
        console.log("VERIFY PAYMENT ERROR:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const cancelOrderItem = async (req, res) => {
    try {
        const result = await orderService.cancelOrderItemService(req.session.userId, req.params.orderId, req.params.itemId, req.body);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const loadReturnRequest = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!order) return res.redirect("/orders");
        res.render("user/returnRequest", { order, itemId: req.query.itemId });
    } catch (err) {
        console.log("LOAD RETURN REQUEST ERROR:", err);
        res.redirect("/orders");
    }
};

export const submitReturnRequest = async (req, res) => {
    try {
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        const result = await orderService.submitReturnRequestService(req.session.userId, req.body, images);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        return res.status(200).json(result);
    } catch (err) {
        console.log("RETURN REQUEST ERROR:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};