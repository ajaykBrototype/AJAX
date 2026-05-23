import * as wishlistService from "../../services/user/wishlist.service.js";

export const loadWishlistPage = async (req, res) => {
  try {
    const data = await wishlistService.getWishlistPageDataService(req.session.userId);
    res.render("user/wishlist", data);
  } catch (err) {
    console.error("LOAD WISHLIST ERROR:", err);
    res.redirect("/");
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const result = await wishlistService.toggleWishlistService(req.session.userId, req.body.productId, req.body.variantId);
    if (!result.success) return res.status(result.statusCode).json(result);
    res.json(result);
  } catch (err) {
    console.error("TOGGLE WISHLIST ERROR:", err);
    res.status(500).json({ success: false });
  }
};

export const clearAllWishlist = async (req, res) => {
  try {
    const result = await wishlistService.clearAllWishlistService(req.session.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const result = await wishlistService.getWishlistCountService(req.session.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const addToBagFromWishlist = async (req, res) => {
  try {
    const result = await wishlistService.addToBagFromWishlistService(req.session.userId, req.body.productId, req.body.variantId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};