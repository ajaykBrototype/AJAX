import Wishlist from "../../models/user/wishlistModel.js";
import Variant from "../../models/admin/variantModel.js";
import Cart from "../../models/user/cartModel.js";

export const loadWishlistPage = async (req, res) => {
  try {
    const userId = req.session.userId;

    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "items.product",
      populate: { path: "subcategory" }
    }).populate("items.variant");

    let wishlistItems = [];

    if (wishlist && wishlist.items.length > 0) {
      wishlistItems = wishlist.items.map(item => {
        if (!item.product || !item.variant) return null;
        return {
          productId: item.product,
          variant: item.variant
        };
      }).filter(Boolean);
    }

    res.render("user/wishlist", {
      wishlistItems
    });
  } catch (err) {
    console.error("LOAD WISHLIST ERROR:", err);
    res.redirect("/");
  }
}

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, variantId } = req.body;
    
    if (!productId || !variantId) {
      return res.status(400).json({ success: false, message: "Missing product or variant info" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    let action = "added";

    if (!wishlist) {
      wishlist = new Wishlist({ 
        user: userId, 
        items: [{ product: productId, variant: variantId }] 
      });
    } else {
      const index = wishlist.items.findIndex(
        item => item.product.toString() === productId && item.variant.toString() === variantId
      );

      if (index > -1) {
        wishlist.items.splice(index, 1);
        action = "removed";
      } else {
        wishlist.items.push({ product: productId, variant: variantId });
      }
    }

    await wishlist.save();
    res.json({ success: true, action, count: wishlist.items.length });
  } catch (err) {
    console.error("TOGGLE WISHLIST ERROR:", err);
    res.status(500).json({ success: false });
  }
};

export const clearAllWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    await Wishlist.findOneAndDelete({ user: userId });
    res.json({ success: true, count: 0 });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.json({ success: true, count: 0 });
    const wishlist = await Wishlist.findOne({ user: userId });
    res.json({ success: true, count: wishlist ? wishlist.items.length : 0 });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const addToBagFromWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, variantId } = req.body;

    const variant = await Variant.findById(variantId);
    if (!variant || !variant.isActive) return res.json({ success: false, message: "Variant not found ❌" });
    if (variant.stock <= 0) return res.json({ success: false, message: "Out of stock ❌" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingItem = cart.items.find(item => item.variant.toString() === variantId);

    if (existingItem) {
      if (existingItem.quantity >= 5) return res.json({ success: false, message: "Max limit reached ❌" });
      existingItem.quantity = Math.min(existingItem.quantity + 1, 5);
      if (!existingItem.productId) existingItem.productId = variant.productId;
    } else {
      cart.items.push({ productId, variant: variantId, quantity: 1 });
    }

    await cart.save();
    
    // Remove specific product-variant pair from wishlist
    await Wishlist.findOneAndUpdate(
        { user: userId }, 
        { $pull: { items: { product: productId, variant: variantId } } }
    );
    
    const updatedWishlist = await Wishlist.findOne({ user: userId });

    res.json({
      success: true,
      message: "Added to cart 🛒",
      cartCount: cart.items.length,
      wishlistCount: updatedWishlist ? updatedWishlist.items.length : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};