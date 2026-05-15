import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Wishlist from "../../models/user/wishlistModel.js";
import Offer from "../../models/admin/offerModel.js";

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
export const loadMenPage = async (req, res) => {
  try {
    const { sub, page = 1 } = req.query;

    const limit = 8; 
    const skip = (page - 1) * limit;

    const menCategory = await Category.findOne({ name: { $regex: "^men$", $options: "i" } });

    if (!menCategory) {
      return res.render("user/menProductList", {
        products: [],
        subCategories: [],
        selectedSub: null,
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0
      });
    }
    const subCategories = await SubCategory.find({
      category: menCategory._id,
      isActive: true
    });

    let filter = {
      isActive: true,
      category: menCategory._id
    };

    if (sub) {
      filter.subcategory = sub;
    } else {
      const subIds = subCategories.map(s => s._id);
      filter.subcategory = { $in: subIds };
    }

    const wishlist = await Wishlist.findOne({ user: req.session.userId });

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    const productData = await Promise.all(
      products.map(async (prod) => {
        const variants = await Variant.find({
          productId: prod._id,
          isActive: true
        }).lean();

        const v = variants[0];
        const offer = v ? getBestOffer(activeOffers, prod, v.price) : null;
        let finalPrice = v?.price || null;
        if (offer && v) {
          let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
          if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
          finalPrice = v.price - d;
        }

        return { ...prod, variants, finalPrice, offer };
      })
    );

    res.render("user/menProductList", {
      products: productData,
      subCategories,
      selectedSub: sub || null,
      currentPage: Number(page),
      totalPages,
      totalProducts,
      wishlist: wishlist?.items.map(i => i.product.toString()) || []
    });
  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id).lean();
    const category = await Category.findById(product.category).lean(); 
    const subCategory = await SubCategory.findById(product.subcategory).lean();

    if (!product || !product.isActive) {
      return res.redirect("/menProductList");
    }

    const variants = await Variant.find({
      productId: id,
      isActive: true
    }).lean();

    const defaultVariant =
      variants.find(v => v.isDefault) || variants[0];

    const relatedRaw = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4).lean();

    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    const pOffers = activeOffers.filter(o => 
      o.applicableTo === 'product' && 
      o.targetProduct && 
      o.targetProduct.toString() === product._id.toString()
    );

    const cOffers = activeOffers.filter(o => 
      o.applicableTo === 'category' && 
      o.targetCategory && 
      product.category && 
      o.targetCategory.toString() === product.category.toString()
    );

    const applicableOffers = [...pOffers, ...cOffers];
    const bestOffer = getBestOffer(activeOffers, product, defaultVariant.price);

    const relatedProducts = await Promise.all(
      relatedRaw.map(async (p) => {
        const v = await Variant.findOne({
          productId: p._id,
          isActive: true
        }).lean();

        const offer = v ? getBestOffer(activeOffers, p, v.price) : null;
        let finalPrice = v?.price || null;
        if (offer && v) {
          let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
          if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
          finalPrice = v.price - d;
        }

        return {
          ...p,
          image: v?.images?.[0] || null,
          price: v?.price || null,
          finalPrice,
          offer
        };
      })
    );

    const stock=defaultVariant?.stock || 0;

    const wishlistDoc = await Wishlist.findOne({ user: req.session.userId });
    const wishlist = wishlistDoc?.items.map(i => i.product.toString()) || [];
    const wishlistedVariants = wishlistDoc?.items.map(i => i.variant.toString()) || [];



    res.render("user/productDetails", {
      product,
      variants,
      variant: defaultVariant,
      relatedProducts,
      category,
      subCategory,
      stock,
      wishlist,
      wishlistedVariants,
      bestOffer,
      applicableOffers
    });

  } catch (err) {
    console.log("PRODUCT DETAILS ERROR:", err);
    res.redirect("/home");
  }
};

export const checkQuantity = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;

    const variant = await Variant.findById(variantId);

    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    if (quantity > 5) {
      return res.json({
        success: false,
        message: "Maximum 5 items allowed"
      });
    }

    if (quantity > variant.stock) {
      return res.json({
        success: false,
        message: `Only ${variant.stock} items available`
      });
    }

    res.json({ success: true });

  } catch (err) {
    res.json({ success: false, message: "Server error" });
  }
};



export const loadFilteredProducts = async (req, res) => {
  try {
    const { search, sort, category, minPrice, maxPrice } = req.query;

    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || 1000000; // Large default for max if not provided

    const menCategory = await Category.findOne({ name: "Men" });

    if (!menCategory) {
      return res.json({ success: true, products: [] });
    }

    let filter = {
      isActive: true,
      category: menCategory._id
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.subcategory = category;
    } else {
      const subs = await SubCategory.find({
        category: menCategory._id,
        isActive: true
      });

      filter.subcategory = { $in: subs.map(s => s._id) };
    }



    let products = await Product.find(filter).lean();

    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    let productData = await Promise.all(
      products.map(async (p) => {
        const variants = await Variant.find({
          productId: p._id,
          isActive: true,
          price: { $gte: min, $lte: max }
        }).lean();

        if (!variants.length) return null;

        const v = variants[0];
        const offer = v ? getBestOffer(activeOffers, p, v.price) : null;
        let finalPrice = v?.price || null;
        if (offer && v) {
          let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
          if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
          finalPrice = v.price - d;
        }

        return { ...p, variants, finalPrice, offer };
      })
    );

    productData = productData.filter(Boolean);


    const getPrice = (p) => p.variants?.[0]?.price || 0;

    if (sort === "price-low") {
      productData.sort((a, b) => getPrice(a) - getPrice(b));
    }

    if (sort === "price-high") {
      productData.sort((a, b) => getPrice(b) - getPrice(a));
    }

    if (sort === "name-az") {
      productData.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "name-za") {
      productData.sort((a, b) => b.name.localeCompare(a.name));
    }

    if (sort === "newest") {
      productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const wishlistDoc = await Wishlist.findOne({ user: req.session.userId });
    const wishlist = wishlistDoc?.items.map(i => i.product.toString()) || [];

    res.json({ success: true, products: productData, wishlist });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};