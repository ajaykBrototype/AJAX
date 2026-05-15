import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import Wallet from "../../models/user/walletModel.js";
import Coupon from "../../models/admin/couponModel.js";
import Order from "../../models/user/orderModel.js";
import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";
import mongoose from "mongoose";

const getBestOffer = (activeOffers, prod, price) => {
  if (!activeOffers || activeOffers.length === 0) return null;

  const pOffers = activeOffers.filter(o => 
    o.applicableTo === 'product' && 
    o.targetProduct && 
    o.targetProduct.toString() === prod._id.toString()
  );

  const cOffers = activeOffers.filter(o => 
    o.applicableTo === 'category' && 
    o.targetCategory && 
    prod.category && 
    o.targetCategory.toString() === prod.category.toString()
  );

  const applicable = [...pOffers, ...cOffers].filter(o => !o.minOrderValue || price >= o.minOrderValue);
  
  let best = null;
  let maxD = 0;
  applicable.forEach(o => {
    let d = 0;
    if (o.discountMode === 'percentage') {
      d = (price * o.discountValue) / 100;
      if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
    } else {
      d = o.discountValue;
    }

    if (d > maxD) {
      maxD = d;
      best = o;
    }
  });
  return best;
};

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

        const today = new Date();
        const activeOffers = await Offer.find({
          isActive: true,
          startDate: { $lte: today },
          endDate: { $gte: today }
        }).lean();

        let subtotal = 0;
        let totalOfferDiscount = 0;

        cart.items.forEach(item => {
          if (item.variant && item.variant.stock > 0) {
            const product = item.variant.productId;
            const bestOffer = getBestOffer(activeOffers, product, item.variant.price);
            
            let itemPrice = item.variant.price;
            let discount = 0;

            if (bestOffer) {
              if (bestOffer.discountMode === 'percentage') {
                discount = (itemPrice * bestOffer.discountValue) / 100;
                if (bestOffer.maxDiscountCap) discount = Math.min(discount, bestOffer.maxDiscountCap);
              } else {
                discount = bestOffer.discountValue;
              }
            }

            item.finalPrice = itemPrice - discount;
            item.offer = bestOffer;
            
            subtotal += itemPrice * item.quantity;
            totalOfferDiscount += discount * item.quantity;
          }
        });

        const totalPrice = subtotal - totalOfferDiscount;
        const wallet = await Wallet.findOne({ userId });

        res.render("user/checkout", { 
          cart, 
          address, 
          addresses, 
          wallet,
          subtotal,
          totalOfferDiscount,
          totalPrice
        });

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

