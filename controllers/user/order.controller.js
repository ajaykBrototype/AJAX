import Order from "../../models/user/orderModel.js";
import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";


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
            totalAmount: total
        });

        cart.items = [];
        await cart.save();

        res.json({ success: true, orderId: order._id });

    } catch (err) {
        console.log("ORDER ERROR FULL:", err);
        res.json({ success: false, message: err.message });
    }
};