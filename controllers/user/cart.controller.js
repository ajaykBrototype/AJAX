import * as cartService from "../../services/user/cart.service.js";

export const addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCartService(req.session.userId, req.body.variantId, req.body.quantity);
    res.json(result);
  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const loadCartPage = async (req, res) => {
  try {
    const data = await cartService.getCartService(req.session.userId);
    res.render("user/cart", data);
  } catch (err) {
    console.log("LOAD CART ERROR:", err);
    res.redirect("/home");
  }
};

export const updateCartQty = async (req, res) => {
  try {
    const result = await cartService.updateCartQtyService(req.session.userId, req.body.itemId, req.body.delta);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const result = await cartService.removeCartItemService(req.session.userId, req.body.itemId);
    res.json(result);
  } catch (err) {
    res.json({ success: false });
  }
};