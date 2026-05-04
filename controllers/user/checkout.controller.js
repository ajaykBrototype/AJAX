import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";

export const loadCheckoutPage = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items.variant",
                populate: { path: "productId" }
            });

        let address = await Address.findOne({
            userId: userId,
            isDefault: true
        });

        if (!address) {
            address = await Address.findOne({ userId: userId });
        }

        console.log("ADDRESS:", address); // ✅ should show data now

        if (!cart || cart.items.length === 0) {
            return res.redirect("/cart");
        }

        res.render("user/checkout", { cart, address });

    } catch (err) {
        console.log("CHECKOUT ERROR:", err);
        res.redirect("/cart");
    }
};