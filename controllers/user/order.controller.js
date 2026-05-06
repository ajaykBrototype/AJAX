import Order from "../../models/user/orderModel.js";
import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";
import User from "../../models/user/userModel.js";


export const loadOrderPage=async (req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        res.render("user/orderSuccess", { order });
    } catch (err) {
        console.log("ORDER PAGE ERROR:", err);
        res.redirect("/home");
    }
}

export const loadOrdersList = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        
        // Fetch orders for the logged-in user, sorted by newest first
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        res.render("user/orders", { 
            user,
            orders,
            activePage: 'orders'
        });
    } catch (err) {
        console.log("LOAD ORDERS ERROR:", err);
        res.redirect("/profile");
    }
};

export const loadOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;
        const user = await User.findById(userId);
        
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.redirect("/orders");
        }

        res.render("user/orderDetails", { 
            user,
            order,
        });
    } catch (err) {
        console.log("LOAD ORDER DETAILS ERROR:", err);
        res.redirect("/orders");
    }
};



export const placeOrder = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.userId);
        const { addressId, paymentMethod } = req.body;

        const normalizedPayment = paymentMethod.toUpperCase();

        console.log("REQ BODY:", req.body);

        if (!addressId) {
            return res.json({ success: false, message: "No address selected" });
        }

        if (!paymentMethod) {
            return res.json({ success: false, message: "Payment method required" });
        }


        const cart = await Cart.findOne({ user: userId }).populate({
            path: "items.variant",
            populate: { path: "productId" }
        });

        if (!cart || cart.items.length === 0) {
            return res.json({ success: false, message: "Cart is empty" });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId: userId
        });

        if (!address) {
            return res.json({ success: false, message: "Invalid address" });
        }

        const orderItems = cart.items.map(item => {
            if (!item.variant || !item.variant.productId) {
                throw new Error("Invalid cart item");
            }

            return {
                productId: item.variant.productId._id,
                variantId: item.variant._id,
                name: item.variant.productId.name,
                price: item.variant.price,
                quantity: item.quantity,
                size:item.variant.size,
                image:item.variant.images[0]
            };
        });

        let total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const shipping = total > 1000 ? 0 : 100;
        total += shipping;

        const order = await Order.create({
            userId,
            items: orderItems,
            address: {
                name: address.name,
                phone: address.phone,
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country
            },
            paymentMethod:normalizedPayment,
            totalAmount: total,
             status: "Placed",

    statusHistory: [
        {
            status: "Placed",
            updatedAt: new Date()
        }
       ]
        });

        cart.items = [];
        await cart.save();

        res.json({ success: true, orderId: order._id });

    } catch (err) {
        console.log("ORDER ERROR FULL:", err);
        res.json({ success: false, message: err.message });
    }
};

