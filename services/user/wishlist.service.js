import Wishlist from "../../models/user/wishlistModel.js";
import Variant from "../../models/admin/variantModel.js";
import Cart from "../../models/user/cartModel.js";
import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";

const getBestOffer = (activeOffers, prod, price) => {
  if (!activeOffers || activeOffers.length === 0) return null;

  const pOffers = activeOffers.filter(o => o.applicableTo === 'product' && o.targetProduct && o.targetProduct.toString() === prod._id.toString());
  const cOffers = activeOffers.filter(o => o.applicableTo === 'category' && o.targetCategory && prod.category && o.targetCategory.toString() === prod.category.toString());

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

export const getWishlistPageDataService = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "items.product", populate: { path: "subcategory" }
  }).populate("items.variant");

  let wishlistItems = [];

  if (wishlist && wishlist.items.length > 0) {
    const today = new Date();
    const activeOffers = await Offer.find({ isActive: true, startDate: { $lte: today }, endDate: { $gte: today } }).lean();

    wishlistItems = wishlist.items.map(item => {
      if (!item.product || !item.variant) return null;
      
      const offer = getBestOffer(activeOffers, item.product, item.variant.price);
      let finalPrice = item.variant.price || null;
      
      if (offer && item.variant.price) {
        let d = offer.discountMode === 'percentage' ? (item.variant.price * offer.discountValue) / 100 : offer.discountValue;
        if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
        finalPrice = item.variant.price - d;
      }

      return { productId: item.product, variant: item.variant, offer: offer || null, finalPrice };
    }).filter(Boolean);
  }

  return { wishlistItems };
};

export const toggleWishlistService = async (userId, productId, variantId) => {
  if (!productId || !variantId) return { success: false, message: "Missing product or variant info", statusCode: 400 };

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
      return { success: false, message: "The product is currently unavailable.", statusCode: 400 };
  }
  
  const variant = await Variant.findById(variantId);
  if (!variant || !variant.isActive) {
      return { success: false, message: "The variant is currently unavailable.", statusCode: 400 };
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  let action = "added";

  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, items: [{ product: productId, variant: variantId }] });
  } else {
    const index = wishlist.items.findIndex(item => item.product.toString() === productId && item.variant.toString() === variantId);

    if (index > -1) {
      wishlist.items.splice(index, 1);
      action = "removed";
    } else {
      wishlist.items.push({ product: productId, variant: variantId });
    }
  }

 

  await wishlist.save();
  return { success: true, action, count: wishlist.items.length, statusCode: 200 };
};

export const clearAllWishlistService = async (userId) => {
  await Wishlist.findOneAndDelete({ user: userId });
  return { success: true, count: 0 };
};

export const getWishlistCountService = async (userId) => {
  if (!userId) return { success: true, count: 0 };
  const wishlist = await Wishlist.findOne({ user: userId });
  return { success: true, count: wishlist ? wishlist.items.length : 0 };
};

export const addToBagFromWishlistService = async (userId, productId, variantId) => {
  const variant = await Variant.findById(variantId).populate("productId");
  if (!variant || !variant.isActive || !variant.productId || !variant.productId.isActive) {
      return { success: false, message: "The product is currently unavailable. ❌" };
  }
  if (variant.stock <= 0) return { success: false, message: "Out of stock ❌" };

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });

  const existingItem = cart.items.find(item => item.variant.toString() === variantId);

  if (existingItem) {
    if (existingItem.quantity >= 5) return { success: false, message: "Max limit reached ❌" };
    existingItem.quantity = Math.min(existingItem.quantity + 1, 5);
    if (!existingItem.productId) existingItem.productId = variant.productId;
  } else {
    cart.items.push({ productId, variant: variantId, quantity: 1 });
  }

  await cart.save();
  
  await Wishlist.findOneAndUpdate({ user: userId }, { $pull: { items: { product: productId, variant: variantId } } });
  const updatedWishlist = await Wishlist.findOne({ user: userId });

  return { success: true, message: "Added to cart 🛒", cartCount: cart.items.length, wishlistCount: updatedWishlist ? updatedWishlist.items.length : 0 };
};
