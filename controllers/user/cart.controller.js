import Cart from "../../models/user/cartModel.js";
import Variant from "../../models/admin/variantModel.js";
import { success } from "zod";

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
      let changed = false;
      const validItems = [];

      for (const item of cart.items) {
        // Remove if variant or product is inactive
        if (!item.variant || !item.variant.isActive || !item.variant.productId || !item.variant.productId.isActive) {
          changed = true;
          continue;
        }

        // Reduce quantity if it exceeds current stock
        if (item.quantity > item.variant.stock) {
          item.quantity = item.variant.stock;
          changed = true;
        }

        // Enforce max limit of 5
        if (item.quantity > 5) {
          item.quantity = 5;
          changed = true;
        }

        if (item.quantity > 0) {
          validItems.push(item);
        } else {
          changed = true;
        }
      }

      if (changed) {
        cart.items = validItems;
        await cart.save();
      }

      let totalPrice = 0;
      cart.items.forEach(item => {
        totalPrice += item.variant.price * item.quantity;
      });

      res.render("user/cart", {
        cart,
        totalPrice
      });
    } else {
      res.render("user/cart", {
        cart: null,
        totalPrice: 0
      });
    }

  } catch (err) {
    console.log("LOAD CART ERROR:", err);
    res.redirect("/home");
  }
};

export const updateCartQty = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { itemId, delta } = req.body;

    const cart = await Cart.findOne({ user: userId });

    const item = cart.items.id(itemId);

    if (!item) {
      return res.json({ success: false });
    }

    const variant = await Variant.findById(item.variant);

    let newQty = item.quantity + delta;

    if (newQty < 1) newQty = 1;
    if (newQty > 5) {
      return res.json({ success: false, message: "Max 5 allowed" });
    }
    if (newQty > variant.stock) {
      return res.json({ success: false, message: "Out of stock" });
    }

    item.quantity = newQty;

    await cart.save();

   
    let total = 0;
    const populatedCart = await Cart.findOne({ user: userId }).populate("items.variant");
    populatedCart.items.forEach(i => {
      if (i.variant) {
        total += i.quantity * i.variant.price;
      }
    });

    res.json({
      success: true,
      qty: newQty,
      total
    });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { itemId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    cart.items.pull({ _id: itemId });

    await cart.save();

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false });
  }
};