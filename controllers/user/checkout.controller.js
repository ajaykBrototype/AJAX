import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import Wallet from "../../models/user/walletModel.js";
import Coupon from "../../models/admin/couponModel.js";
import Order from "../../models/user/orderModel.js";
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

        const wallet = await Wallet.findOne({ userId });

        res.render("user/checkout", { cart, address, addresses, wallet });

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




export const getAvailableCoupons = async (req, res) => {

    try {

        const subtotal =
            Number(req.query.subtotal);



        const today =
            new Date();

        const startOfToday =
            new Date(
                today.setHours(
                    0, 0, 0, 0
                )
            );



        const coupons =
            await Coupon.find({

            status: "active",

            startDate: {
                 $lte: new Date()
            },

            endDate: {
                $gte: startOfToday
            }
        });



        const formattedCoupons =await Promise.all(

            coupons.map(async (coupon) => {

                const userUsage =await Order.countDocuments({

                    userId:req.session.userId,

                    couponCode:coupon.code,

                    status: {
                        $ne: "Cancelled"
                    }
                });



                let eligible = true;

                let reason = "Eligible";

                if (subtotal <coupon.minOrder) {
                    eligible = false;

                    reason =`Min ₹${coupon.minOrder} required`;
                }

                else if (

                    coupon.userLimit &&

                    userUsage >=coupon.userLimit
                ) {

                    eligible = false;

                    reason = "Already Used";
                }

                else if (

                    coupon.maxUsage &&

                    coupon.usageCount >=
                    coupon.maxUsage
                ) {

                    eligible = false;

                    reason ="Limit Reached";
                }



                return {

                    _id: coupon._id,

                    code: coupon.code,

                    discountType:coupon.discountType,

                    discountAmount:coupon.discountAmount,

                    minOrder:coupon.minOrder,

                    maxDiscount:coupon.maxDiscount,

                    eligible,

                    reason,

                    alreadyUsed: coupon.userLimit &&

                        userUsage >=coupon.userLimit
                };
            })
        );



        res.json({

            success: true,

            coupons: formattedCoupons
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false
        });
    }
};

export const applyCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        const userId = req.session.userId;
        const today = new Date();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            status: "active",
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or expired coupon code" });
        }

        // Check overall usage limit (treat 0 or null as unlimited)
        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
            return res.json({ success: false, message: "Coupon usage limit reached" });
        }

        // Check per-user limit
        const userUsageCount = await Order.countDocuments({
            userId,
            couponCode: coupon.code,
            status: { $ne: "Cancelled" } // Don't count cancelled orders
        });

        if (coupon.userLimit && userUsageCount >= coupon.userLimit) {
            return res.json({ success: false, message: "You have already redeemed this coupon" });
        }

        if (subtotal < coupon.minOrder) {
            return res.json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minOrder} required for this coupon`
            });
        }

        let discount = 0;
        if (coupon.discountType === "flat") {
            discount = coupon.discountAmount;
        } else {
            discount = (subtotal * coupon.discountAmount) / 100;
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        }

        res.json({
            success: true,
            message: "Coupon applied successfully",
            discount,
            code: coupon.code
        });

    } catch (err) {
        console.log("APPLY COUPON ERROR:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

