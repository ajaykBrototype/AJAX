import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import Wallet from "../../models/user/walletModel.js";
import Coupon from "../../models/admin/couponModel.js";
import Order from "../../models/user/orderModel.js";
import Offer from "../../models/admin/offerModel.js";
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
    let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
    if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);

    
    if (d > maxD) {
      maxD = d;
      best = o;
    }
  });
  return best;
};

export const getCheckoutPageDataService = async (userId, selectedAddressId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const cart = await Cart.findOne({ user: userObjId }).populate({
    path: "items.variant",
    populate: { path: "productId" }
  });

  if (!cart || cart.items.length === 0) return null;

  const addresses = await Address.find({ userId: userObjId });
  let address;

  if (selectedAddressId) {
    address = await Address.findById(selectedAddressId);
  } else {
    address = await Address.findOne({ userId: userObjId, isDefault: true }) || await Address.findOne({ userId: userObjId });
  }

  const today = new Date();
  const activeOffers = await Offer.find({
    isActive: true, startDate: { $lte: today }, endDate: { $gte: today }
  }).lean();

  let subtotal = 0;
  let totalOfferDiscount = 0;
  let couponEligibleSubtotal = 0;

  cart.items.forEach(item => {
    if (item.variant && item.variant.stock > 0) {
      const product = item.variant.productId;
      const bestOffer = getBestOffer(activeOffers, product, item.variant.price);
      
      let itemPrice = item.variant.price;
      let discount = 0;

      if (bestOffer) {
        discount = bestOffer.discountMode === 'percentage' ? (itemPrice * bestOffer.discountValue) / 100 : bestOffer.discountValue;
        if (bestOffer.maxDiscountCap) discount = Math.min(discount, bestOffer.maxDiscountCap);
      }

      item.finalPrice = itemPrice - discount;
      item.offer = bestOffer;
      
      subtotal += itemPrice * item.quantity;
      totalOfferDiscount += discount * item.quantity;

      if (!bestOffer) couponEligibleSubtotal += item.finalPrice * item.quantity;
    }
  });

  const totalPrice = subtotal - totalOfferDiscount;
  const wallet = await Wallet.findOne({ userId: userObjId });

  return { cart, address, addresses, wallet, subtotal, totalOfferDiscount, totalPrice, couponEligibleSubtotal };
};

export const saveAddressService = async (userId, addressData) => {
  const { addressId, name, street, area, city, state, pincode, phone, type, isDefault } = addressData;
  const isDefaultValue = isDefault === "on" || isDefault === true; 

  if (isDefaultValue) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  if (addressId) {
    await Address.findByIdAndUpdate(addressId, { name, street, city, area, state, pincode, phone, type, isDefault: isDefaultValue });
  } else {
    await Address.create({ userId, name, street, area, city, state, pincode, phone, type, isDefault: isDefaultValue });
  }

  return { success: true };
};

export const getAvailableCouponsService = async (userId, subtotal, couponEligibleSubtotal) => {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));

  const coupons = await Coupon.find({
    status: "active", startDate: { $lte: new Date() }, endDate: { $gte: startOfToday }
  });

  const formattedCoupons = await Promise.all(
    coupons.map(async (coupon) => {
      const userUsage = await Order.countDocuments({
        userId, couponCode: coupon.code, status: { $ne: "Cancelled" }
      });

      let eligible = true;
      let reason = "Eligible";

      if (couponEligibleSubtotal <= 0) {
        eligible = false;
        reason = "Not applicable on offer products";
      } else if (couponEligibleSubtotal < coupon.minOrder) {
        eligible = false;
        reason = `Min ₹${coupon.minOrder} eligible amount required`;
      } else if (coupon.userLimit && userUsage >= coupon.userLimit) {
        eligible = false;
        reason = "Already Used";
      } else if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
        eligible = false;
        reason = "Limit Reached";
      }

      return {
        _id: coupon._id, code: coupon.code, discountType: coupon.discountType, discountAmount: coupon.discountAmount,
        minOrder: coupon.minOrder, maxDiscount: coupon.maxDiscount, eligible, reason,
        alreadyUsed: coupon.userLimit && userUsage >= coupon.userLimit
      };
    })
  );

  return { success: true, coupons: formattedCoupons };
};

export const applyCouponService = async (userId, code, subtotal, couponEligibleSubtotal) => {
  const today = new Date();
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(), status: "active", startDate: { $lte: today }, endDate: { $gte: today }
  });

  if (!coupon) return { success: false, message: "Invalid or expired coupon code" };

  if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
    return { success: false, message: "Coupon usage limit reached" };
  }

  const userUsageCount = await Order.countDocuments({ userId, couponCode: coupon.code, status: { $ne: "Cancelled" } });
  if (coupon.userLimit && userUsageCount >= coupon.userLimit) {
    return { success: false, message: "You have already redeemed this coupon" };
  }

  if (couponEligibleSubtotal <= 0) {
    return { success: false, message: "Coupons cannot be applied to offer products" };
  }

  if (couponEligibleSubtotal < coupon.minOrder) {
    return { success: false, message: `Minimum eligible purchase of ₹${coupon.minOrder} required for this coupon` };
  }

  let discount = 0;
  if (coupon.discountType === "flat") {
    discount = coupon.discountAmount;
  } else {
    discount = (couponEligibleSubtotal * coupon.discountAmount) / 100;
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  }
  discount = Math.min(discount, couponEligibleSubtotal);

  return { success: true, message: "Coupon applied successfully", discount, code: coupon.code };
};
