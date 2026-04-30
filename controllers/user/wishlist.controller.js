import Wishlist from "../../models/user/wishlistModel.js";
import Variant from "../../models/admin/variantModel.js";
import Cart from "../../models/user/cartModel.js";

export const loadWishlistPage = async (req, res) => {
  try {
    const userId = req.session.userId;

    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products",
      populate: { path: "subcategory" }
    });

    let wishlistItems = [];

    if (wishlist && wishlist.products.length > 0) {
      wishlistItems = await Promise.all(
        wishlist.products.map(async (prod) => {
          const variants = await Variant.find({ productId: prod._id, isActive: true }).lean();
          return {
            productId: {
              ...prod.toObject(),
              variants: variants
            }
          };
        })
      );
    }

    res.render("user/wishlist", {
      wishlistItems
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
}

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false });

    let wishlist = await Wishlist.findOne({ user: userId });
    let action = "added";

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [productId] });
    } else {
      const index = wishlist.products.findIndex(p => p.toString() === productId);
      if (index > -1) {
        wishlist.products.splice(index, 1);
        action = "removed";
      } else {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    res.json({ success: true, action, count: wishlist.products.length });
  } catch (err) {
    console.error(err);
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
    res.json({ success: true, count: wishlist ? wishlist.products.length : 0 });
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
    await Wishlist.findOneAndUpdate({ user: userId }, { $pull: { products: productId } });
    const updatedWishlist = await Wishlist.findOne({ user: userId });

    res.json({
      success: true,
      message: "Added to cart 🛒",
      cartCount: cart.items.length,
      wishlistCount: updatedWishlist ? updatedWishlist.products.length : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};