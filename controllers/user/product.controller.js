import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Wishlist from "../../models/user/wishlistModel.js";
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

    const productData = await Promise.all(
      products.map(async (prod) => {
        const variants = await Variant.find({
          productId: prod._id,
          isActive: true
        }).lean();

        return { ...prod, variants };
      })
    );

    res.render("user/menProductList", {
      products: productData,
      subCategories,
      selectedSub: sub || null,
      currentPage: Number(page),
      totalPages,
      totalProducts,
      wishlist: wishlist?.products.map(p => p.toString()) || []
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

    const relatedProducts = await Promise.all(
      relatedRaw.map(async (p) => {
        const v = await Variant.findOne({
          productId: p._id,
          isActive: true
        }).lean();

        return {
          ...p,
          image: v?.images?.[0] || null,
          price: v?.price || null
        };
      })
    );

    const stock=defaultVariant?.stock || 0;

    res.render("user/productDetails", {
      product,
      variants,
      variant: defaultVariant,
      relatedProducts,
      category,
      subCategory,
      stock
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

    let productData = await Promise.all(
      products.map(async (p) => {
        const variants = await Variant.find({
          productId: p._id,
          isActive: true,
          price: { $gte: min, $lte: max }
        }).lean();

        return variants.length ? { ...p, variants } : null;
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

    res.json({ success: true, products: productData });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};