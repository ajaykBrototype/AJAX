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

        const addresses = await Address.find({ userId: userId });

        const selectedAddressId = req.query.addressId;

        let address;

        if (selectedAddressId) {
            address = await Address.findById(selectedAddressId);
        } else {
            address = await Address.findOne({ userId: userId, isDefault: true });

            if (!address) {
                address = await Address.findOne({ userId: userId });
            }
        }

        if (!cart || cart.items.length === 0) {
            return res.redirect("/cart");
        }

        res.render("user/checkout", { cart, address, addresses });

    } catch (err) {
        console.log("CHECKOUT ERROR:", err);
        res.redirect("/cart");
    }
};

export const saveAddress = async (req, res) => {
    try {
        const userId = req.session.userId;

        const {
            addressId,
            name,
            street,
            area,
            city,
            state,
            pincode,
            phone, 
            type,
            isDefault
        } = req.body;

        const isDefaultValue = isDefault === "on"; 

        if (isDefaultValue) {
            await Address.updateMany(
                { userId },
                { $set: { isDefault: false } }
            );
        }

        if (addressId) {
           
            await Address.findByIdAndUpdate(addressId, {
                name,
                street,
                city,
                area,
                state,
                pincode,
                phone,
                type,
                isDefault: isDefaultValue
            });
        } else {
            
            await Address.create({
                userId,
                name,
                street,
                area,
                city,
                state,
                pincode,
                phone,
                type,
                isDefault: isDefaultValue
            });
        }

        res.redirect("/checkout");

    } catch (err) {
        console.log("SAVE ADDRESS ERROR:", err);
        res.redirect("/checkout");
    }
};