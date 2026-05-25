import Order from "../../models/user/orderModel.js";
import Cart from "../../models/user/cartModel.js";
import Wallet from "../../models/user/walletModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";
import User from "../../models/user/userModel.js";
import Variant from "../../models/admin/variantModel.js";
import Return from "../../models/user/returnModel.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import Coupon from "../../models/admin/couponModel.js";
import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";

const getBestOffer = (activeOffers, prod, price) => {
    if (!activeOffers || activeOffers.length === 0) return null;
  
    const pOffers = activeOffers.filter(o => 
      o.applicableTo === 'product' && o.targetProduct && o.targetProduct.toString() === prod._id.toString()
    );
  
    const cOffers = activeOffers.filter(o => 
      o.applicableTo === 'category' && o.targetCategory && prod.category && o.targetCategory.toString() === prod.category.toString()
    );
  
    const applicable = [...pOffers, ...cOffers].filter(o => !o.minOrderValue || price >= o.minOrderValue);
    
    let best = null;
    let maxD = 0;
    applicable.forEach(o => {
      let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
      if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
  
      if (d > maxD) {
        maxD = d;
        best = o;
      }
    });
    return best;
};

export const getOrdersListService = async (userId, search, sort) => {
    const user = await User.findById(userId);
    let filter = { userId, status: { $ne: "Pending" } };
    const now = new Date();

    if (sort === "30days") {
        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 30);
        filter.createdAt = { $gte: last30Days };
    }
    if (sort === "6months") {
        const last6Months = new Date();
        last6Months.setMonth(now.getMonth() - 6);
        filter.createdAt = { $gte: last6Months };
    }
    if (sort === "2025") {
        filter.createdAt = { $gte: new Date("2025-01-01"), $lte: new Date("2025-12-31") };
    }

    if (search) {
        filter["items.name"] = { $regex: search, $options: "i" };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return { user, orders };
};

export const getOrderDetailsService = async (userId, orderId) => {
    const user = await User.findById(userId);
    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) return null;

    const returns = await Return.find({ orderId: order._id });

    return { user, order, returns };
};

export const placeOrderService = async (userIdRaw, { addressId, paymentMethod, couponCode }) => {
    const userId = new mongoose.Types.ObjectId(userIdRaw);
    const normalizedPayment = paymentMethod.toUpperCase();

    if (!addressId) return { success: false, message: "No address selected" };
    if (!paymentMethod) return { success: false, message: "Payment method required" };

    const cart = await Cart.findOne({ user: userId }).populate({
        path: "items.variant", populate: { path: "productId" }
    });

    if (!cart || cart.items.length === 0) return { success: false, message: "Cart is empty" };

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) return { success: false, message: "Invalid address" };

    const orderItems = [];
    let couponEligibleSubtotal = 0;

    const today = new Date();
    const activeOffers = await Offer.find({
        isActive: true, startDate: { $lte: today }, endDate: { $gte: today }
    }).lean();

    for (const item of cart.items) {
        if (!item.variant || !item.variant.productId) throw new Error("Invalid cart item");
        if (item.variant.stock < item.quantity) throw new Error(`${item.variant.productId.name} is out of stock`);

        if (normalizedPayment !== "RAZORPAY") {
            item.variant.stock -= item.quantity;
            await item.variant.save();
        }

        const product = item.variant.productId;
        const bestOffer = getBestOffer(activeOffers, product, item.variant.price);
        
        let finalUnitPrice = item.variant.price;
        if (bestOffer) {
            let discount = bestOffer.discountMode === 'percentage' ? (finalUnitPrice * bestOffer.discountValue) / 100 : bestOffer.discountValue;
            if (bestOffer.maxDiscountCap) discount = Math.min(discount, bestOffer.maxDiscountCap);
            finalUnitPrice = Math.round((finalUnitPrice - discount) * 100) / 100;
        }

        orderItems.push({
            productId: item.variant.productId._id,
            variantId: item.variant._id,
            name: item.variant.productId.name,
            price: finalUnitPrice,
            originalPrice: item.variant.price,
            quantity: item.quantity,
            size: item.variant.size,
            image: item.variant.images[0],
            status: "Placed"
        });

        if (!bestOffer) couponEligibleSubtotal += finalUnitPrice * item.quantity;
    }

    const subtotal = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
    const totalOfferDiscount = Math.round(orderItems.reduce((sum, item) => sum + (item.originalPrice - item.price) * item.quantity, 0) * 100) / 100;

    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
        appliedCoupon = await Coupon.findOne({
            code: couponCode.toUpperCase(), status: "active", startDate: { $lte: today }, endDate: { $gte: today }
        });

        if (appliedCoupon && couponEligibleSubtotal >= appliedCoupon.minOrder) {
            discount = appliedCoupon.discountType === "flat" ? appliedCoupon.discountAmount : (couponEligibleSubtotal * appliedCoupon.discountAmount) / 100;
            if (appliedCoupon.maxDiscount > 0 && discount > appliedCoupon.maxDiscount) discount = appliedCoupon.maxDiscount;
            discount = Math.round(Math.min(discount, couponEligibleSubtotal) * 100) / 100;
            
            const globalLimitMet = !appliedCoupon.maxUsage || appliedCoupon.usageCount < appliedCoupon.maxUsage;
            const userUsage = await Order.countDocuments({ userId, couponCode: appliedCoupon.code, status: { $ne: "Cancelled" } });
            const userLimitMet = !appliedCoupon.userLimit || userUsage < appliedCoupon.userLimit;

            if (globalLimitMet && userLimitMet) {
                appliedCoupon.usageCount += 1;
                await appliedCoupon.save();
            } else {
                discount = 0;
                appliedCoupon = null;
            }
        }
    }

    const shipping = subtotal > 1000 ? 0 : 100;
    const total = subtotal + shipping - discount;

    const order = await Order.create({
        userId, items: orderItems,
        address: { name: address.name, phone: address.phone, street: address.street, area: address.area, city: address.city, state: address.state, pincode: address.pincode, country: address.country },
        paymentMethod: normalizedPayment, totalAmount: total, discount, totalOfferDiscount, couponCode: appliedCoupon ? appliedCoupon.code : null,
        status: normalizedPayment === "RAZORPAY" ? "Pending" : "Placed",
        statusHistory: [{ status: normalizedPayment === "RAZORPAY" ? "Pending" : "Placed", updatedAt: new Date() }]
    });

    if (normalizedPayment === "WALLET") {
        const wallet = await Wallet.findOne({ userId });
        if (!wallet || wallet.balance < total) throw new Error("Insufficient wallet balance");
        
        wallet.balance -= total;
        wallet.transactions.push({
            transactionId: "PAY" + Date.now(), orderId: order._id, type: "debit", amount: total,
            description: "Payment for Order #" + order._id.toString().slice(-6), date: new Date()
        });
        await wallet.save();
    }

    if (normalizedPayment === "RAZORPAY") {
        const options = { amount: Math.round(total * 100), currency: "INR", receipt: "order_" + order._id.toString() };
        const rzpOrder = await razorpay.orders.create(options);
        return { success: true, razorpayOrder: rzpOrder, orderId: order._id };
    }

    cart.items = [];
    await cart.save();

    return { success: true, orderId: order._id };
};

export const verifyOrderPaymentService = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");

    if (generatedSignature !== razorpay_signature) return { success: false, message: "Payment verification failed" };

    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: "Order not found" };

    if (order.status === "Pending") {
        for (const item of order.items) {
            const variant = await Variant.findById(item.variantId);
            if (variant) {
                variant.stock -= item.quantity;
                await variant.save();
            }
        }
    }

    order.status = "Placed";
    order.paymentStatus = "Paid"; 
    await order.save();

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
        cart.items = [];
        await cart.save();
    }

    return { success: true };
};

export const cancelOrderItemService = async (userId, orderId, itemId, { reason, note }) => {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return { success: false, statusCode: 404, message: "Order not found" };

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) return { success: false, statusCode: 404, message: "Item not found" };

    if (item.refunded) return { success: false, statusCode: 400, message: "Refund already processed" };
    if (item.status === "Cancelled") return { success: false, statusCode: 400, message: "Item already cancelled" };
    if (order.status === "Delivered" || order.status === "Cancelled") return { success: false, statusCode: 400, message: "Cannot cancel this order" };

    const variant = await Variant.findById(item.variantId);
    if (variant) {
        variant.stock += item.quantity;
        await variant.save();
    }

    const oldTotal = order.totalAmount;
    item.status = "Cancelled";
    item.cancellationReason = reason;
    item.cancellationNote = note;
    order.markModified('items');

    const activeItems = order.items.filter(i => i.status !== "Cancelled");
    const newSubtotal = Math.round(activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 100) / 100;

    let remainingDiscount = 0;
    if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
        if (coupon) {
            const remainingEligibleSubtotal = activeItems.reduce((sum, i) => sum + ((i.originalPrice && i.originalPrice !== i.price) ? 0 : i.price * i.quantity), 0);
            if (remainingEligibleSubtotal >= coupon.minOrder) {
                remainingDiscount = coupon.discountType === "flat" ? coupon.discountAmount : (remainingEligibleSubtotal * coupon.discountAmount) / 100;
                if (coupon.maxDiscount > 0 && remainingDiscount > coupon.maxDiscount) remainingDiscount = coupon.maxDiscount;
                remainingDiscount = Math.round(Math.min(remainingDiscount, remainingEligibleSubtotal) * 100) / 100;
            }
        }
    }

    const shipping = (newSubtotal > 1000 || newSubtotal === 0) ? 0 : 100;
    const newTotal = Math.round((newSubtotal + shipping - remainingDiscount) * 100) / 100;

    order.discount = remainingDiscount;
    order.totalAmount = newTotal;

    const allCancelled = order.items.every(i => i.status === "Cancelled");
    if (allCancelled) {
        order.status = "Cancelled";
        order.cancellationReason = reason;
        order.cancellationNote = note;
        order.statusHistory.push({ status: "Cancelled", updatedAt: new Date(), reason, note });
    }

    if (order.paymentMethod !== "COD") {
        const refundAmount = Math.round(Math.max(0, oldTotal - newTotal) * 100) / 100;
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) wallet = await Wallet.create({ userId, balance: 0, transactions: [] });

        wallet.balance += refundAmount;
        wallet.transactions.push({
            transactionId:"REF" + Date.now(), orderId: order._id, type: "credit", amount: refundAmount,
            description:"Refund for cancelled order item", date: new Date()
        });

        item.refunded = true;
        await wallet.save();
    }
    
    await order.save();
    return { success: true };
};

export const submitReturnRequestService = async (userId, data, images) => {
    const { orderId, itemId, reason, condition, comment } = data;
    if (!orderId || !reason || !condition || !comment) return { success: false, statusCode: 400, message: "All fields are required" };
    if (comment.trim().length < 20) return { success: false, statusCode: 400, message: "Comment must be at least 20 characters" };

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return { success: false, statusCode: 404, message: "Order not found" };
    if (order.status !== "Delivered") return { success: false, statusCode: 400, message: "Only delivered orders can be returned" };

    let itemsToReturn = [];
    if (itemId) {
        const item = order.items.find(i => i._id.toString() === itemId);
        if (!item) return { success: false, statusCode: 404, message: "Item not found" };
        itemsToReturn.push(item);
    } else {
        itemsToReturn = order.items.filter(i => i.status !== "Cancelled");
    }

    let createdCount = 0;

    for (const item of itemsToReturn) {
        if (item.status === "Cancelled") continue;

        const existingReturn = await Return.findOne({ itemId: item._id });
        if (existingReturn) continue;

        const activeBefore = order.items.filter(i => i.status !== "Cancelled" && i.status !== "Returned" && i.status !== "Return Requested");
        let subtotalBefore = Math.round(activeBefore.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 100) / 100;
        let discountBefore = 0;
        if (order.couponCode) {
            const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
            if (coupon) {
                const eligibleBefore = activeBefore.reduce((sum, i) => sum + ((i.originalPrice && i.originalPrice !== i.price) ? 0 : i.price * i.quantity), 0);
                if (eligibleBefore >= coupon.minOrder) {
                    discountBefore = coupon.discountType === "flat" ? coupon.discountAmount : (eligibleBefore * coupon.discountAmount) / 100;
                    if (coupon.maxDiscount > 0 && discountBefore > coupon.maxDiscount) discountBefore = coupon.maxDiscount;
                    discountBefore = Math.round(Math.min(discountBefore, eligibleBefore) * 100) / 100;
                }
            }
        }
        const shippingBefore = (subtotalBefore > 1000 || subtotalBefore === 0) ? 0 : 100;
        const totalBefore = Math.round((subtotalBefore + shippingBefore - discountBefore) * 100) / 100;

        const activeAfter = activeBefore.filter(i => i._id.toString() !== item._id.toString());
        let subtotalAfter = Math.round(activeAfter.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 100) / 100;
        let discountAfter = 0;
        if (order.couponCode) {
            const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
            if (coupon) {
                const eligibleAfter = activeAfter.reduce((sum, i) => sum + ((i.originalPrice && i.originalPrice !== i.price) ? 0 : i.price * i.quantity), 0);
                if (eligibleAfter >= coupon.minOrder) {
                    discountAfter = coupon.discountType === "flat" ? coupon.discountAmount : (eligibleAfter * coupon.discountAmount) / 100;
                    if (coupon.maxDiscount > 0 && discountAfter > coupon.maxDiscount) discountAfter = coupon.maxDiscount;
                    discountAfter = Math.round(Math.min(discountAfter, eligibleAfter) * 100) / 100;
                }
            }
        }
        const shippingAfter = (subtotalAfter > 1000 || subtotalAfter === 0) ? 0 : 100;
        const totalAfter = Math.round((subtotalAfter + shippingAfter - discountAfter) * 100) / 100;

        let refundAmt = Math.round(Math.max(0, totalBefore - totalAfter) * 100) / 100;

        await Return.create({ orderId, itemId: item._id, userId, reason, condition, comment, images, refundAmount: refundAmt });
        item.status = "Return Requested";
        createdCount++;
    }

    if (createdCount === 0) return { success: false, statusCode: 400, message: "Return already requested" };

    order.markModified("items");
    await order.save();

    return { success: true, statusCode: 200, message: "Return request submitted successfully" };
};
