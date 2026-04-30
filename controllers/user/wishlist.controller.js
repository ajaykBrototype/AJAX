``
import Wishlist from "../../models/user/wishlistModel.js";
import Variant from "../../models/admin/variantModel.js";

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

    let wishlist = await Wishlist.findOne({ user: userId });

    let action = "added";

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
    } else {
      const index = wishlist.products.findIndex(
        p => p.toString() === productId
      );

      if (index > -1) {
        wishlist.products.splice(index, 1);
        action = "removed";
      } else {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();

    res.json({
      success: true,
      action,
      count: wishlist.products.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};