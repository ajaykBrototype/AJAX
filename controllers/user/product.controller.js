import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
export const loadMenPage = async (req, res) => {
  try {
    const { sub, page = 1 } = req.query;

    const limit = 8; // products per page
    const skip = (page - 1) * limit;

    // ✅ Get category
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

    // ✅ Get subcategories
    const subCategories = await SubCategory.find({
      category: menCategory._id,
      isActive: true
    });

    let filter = {
      isActive: true,
      category: menCategory._id
    };

    // ✅ Subcategory filter
    if (sub) {
      filter.subcategory = sub;
    } else {
      const subIds = subCategories.map(s => s._id);
      filter.subcategory = { $in: subIds };
    }

    // ✅ Total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // ✅ Get paginated products
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