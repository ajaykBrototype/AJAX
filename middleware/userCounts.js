// middleware/userCounts.js

import Cart from "../models/user/cartModel.js";
import Wishlist from "../models/user/wishlistModel.js";

export const loadUserCounts = async (req, res, next) => {

  res.locals.cartCount = 0;

  res.locals.wishlistCount = 0;

  if (!req.session.userId) {
    return next();
  }

  try {

    const [cart, wishlist] = await Promise.all([

      Cart.findOne({ user: req.session.userId }),

      Wishlist.findOne({ user: req.session.userId })

    ]);

    if (cart) {
      res.locals.cartCount = cart.items.length;
    }

    if (wishlist) {
      res.locals.wishlistCount = wishlist.items.length;
    }

  } catch (err) {

    console.error("User Counts Middleware Error:", err);
  }

  next();
};