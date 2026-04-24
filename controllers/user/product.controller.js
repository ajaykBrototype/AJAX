import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
export const loadMenPage = async (req, res) => {
  try {
    const { sub, page = 1 } = req.query;

    const limit = 8; // products per page
    const skip = (page - 1) * limit;

    const menCategory = await Category.findOne({ name: "Men" });

    if (!menCategory) {
      return res.render("user/menProductList", {
        products: [],
        subCategories: [],
        selectedSub: null,
        currentPage: 1,
        totalPages: 1
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
      totalProducts
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

    if (!product) {
      return res.redirect("/home");
    }

    const variants = await Variant.find({
      productId: id,
      isActive: true
    }).lean();

    const defaultVariant =
      variants.find(v => v.isDefault) || variants[0];

    const relatedRaw = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
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

    res.render("user/productDetails", {
      product,
      variants,
      variant: defaultVariant,
      relatedProducts,
      category,
      subCategory
    });

  } catch (err) {
    console.log("PRODUCT DETAILS ERROR:", err);
    res.redirect("/home");
  }
};