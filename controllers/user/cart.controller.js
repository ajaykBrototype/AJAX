import Cart from "../../models/user/cartModel.js";
import Variant from "../../models/admin/variantModel.js";
import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";

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
    let d = 0;
    if (o.discountMode === 'percentage') {
      d = (price * o.discountValue) / 100;
      if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
    } else {
      d = o.discountValue;
    }

    if (d > maxD) {
      maxD = d;
      best = o;
    }
  });
  return best;
};

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
      if (existingItem.quantity >= 5) return res.json({ success: false, message: "Max limit reached ❌" });
      existingItem.quantity = Math.min(existingItem.quantity + quantity, 5);
      if (!existingItem.productId) existingItem.productId = variant.productId;
    } else {
      cart.items.push({
        productId: variant.productId,
        variant: variantId,
        quantity: Math.min(quantity, 5)
      });
    }

    await cart.save();

    res.json({ success: true, cartCount: cart.items.length });

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
        // Remove only if variant or product is inactive (deleted/hidden)
        if (!item.variant || !item.variant.isActive || !item.variant.productId || !item.variant.productId.isActive) {
          changed = true;
          continue;
        }

        // Enforce max limit of 5
        if (item.quantity > 5) {
          item.quantity = 5;
          changed = true;
        }

        // Handle stock capping: if stock > 0 but quantity exceeds stock
        if (item.variant.stock > 0 && item.quantity > item.variant.stock) {
          item.quantity = item.variant.stock;
          changed = true;
        }

        // Items with 0 stock will be kept in validItems but handled in UI
        validItems.push(item);
      }

      if (changed) {
        cart.items = validItems;
        await cart.save();
      }

      const today = new Date();
      const activeOffers = await Offer.find({
        isActive: true,
        startDate: { $lte: today },
        endDate: { $gte: today }
      }).lean();

      let subtotal = 0;
      let totalDiscount = 0;

      cart.items.forEach(item => {
        if (item.variant && item.variant.stock > 0) {
          const product = item.variant.productId;
          const bestOffer = getBestOffer(activeOffers, product, item.variant.price);
          
          let itemPrice = item.variant.price;
          let discount = 0;

          if (bestOffer) {
            if (bestOffer.discountMode === 'percentage') {
              discount = (itemPrice * bestOffer.discountValue) / 100;
              if (bestOffer.maxDiscountCap) discount = Math.min(discount, bestOffer.maxDiscountCap);
            } else {
              discount = bestOffer.discountValue;
            }
          }

          item.finalPrice = itemPrice - discount;
          item.offer = bestOffer;
          
          subtotal += itemPrice * item.quantity;
          totalDiscount += discount * item.quantity;
        }
      });

      const totalPrice = subtotal - totalDiscount;

      res.render("user/cart", {
        cart,
        subtotal,
        totalDiscount,
        totalPrice
      });
    } else {
      res.render("user/cart", {
        cart: null,
        subtotal: 0,
        totalDiscount: 0,
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

   
    let subtotal = 0;
    let totalDiscount = 0;

    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    const populatedCart = await Cart.findOne({ user: userId }).populate({
      path: "items.variant",
      populate: { path: "productId" }
    });

    populatedCart.items.forEach(i => {
      if (i.variant && i.variant.stock > 0) {
        const product = i.variant.productId;
        const bestOffer = getBestOffer(activeOffers, product, i.variant.price);
        
        let itemPrice = i.variant.price;
        let discount = 0;

        if (bestOffer) {
          if (bestOffer.discountMode === 'percentage') {
            discount = (itemPrice * bestOffer.discountValue) / 100;
            if (bestOffer.maxDiscountCap) discount = Math.min(discount, bestOffer.maxDiscountCap);
          } else {
            discount = bestOffer.discountValue;
          }
        }

        subtotal += itemPrice * i.quantity;
        totalDiscount += discount * i.quantity;
      }
    });

    const totalPrice = subtotal - totalDiscount;

    res.json({
      success: true,
      qty: newQty,
      subtotal,
      totalDiscount,
      totalPrice
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