import Cart from "../../models/user/cartModel.js";
import Variant from "../../models/admin/variantModel.js";

export const addToCart = async (req, res) => {
  try {
    console.log("SESSION:", req.session);
    const userId = req.session.userId;
    const { variantId, quantity } = req.body;

    const variant = await Variant.findById(variantId);

    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    if (quantity > variant.stock) {
      return res.json({ success: false, message: "Out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.variant.toString() === variantId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        variant: variantId,
        quantity
      });
    }

    await cart.save();

    res.json({ success: true });

  } catch (err) {
   console.log("SERVER ERROR:", err); // 👈 VERY IMPORTANT
    res.status(500).json({ success: false, message: "Server Error" });

};
}
export const loadCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.variant",
        populate: {
          path: "productId"
        }
      });

    let totalPrice = 0;

    if (cart) {
      cart.items.forEach(item => {
        totalPrice += item.variant.price * item.quantity;
      });
    }

    res.render("user/cart", {
      cart,
      totalPrice
    });

  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};
