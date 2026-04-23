import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";

export const loadMenPage = async (req, res) => {
  try {

    // 🔥 1. Get category by name
    const menCategory = await Category.findOne({ name: "Men" });

    if (!menCategory) {
      return res.render("user/menProductList", { products: [] });
    }

    // 🔥 2. Get subcategories
    const subCategories = await SubCategory.find({
      category: menCategory._id,
      isActive: true
    });

    const subCategoryIds = subCategories.map(sub => sub._id);

    // 🔥 3. Get products
    const products = await Product.find({
      subcategory: { $in: subCategoryIds },
      isActive: true
    });

    // 🔥 4. Attach variants
    const productData = await Promise.all(
      products.map(async (prod) => {
        const variants = await Variant.find({
          productId: prod._id,
          isActive: true
        });

        return {
          ...prod._doc,
          variants
        };
      })
    );

    res.render("user/menProductList", {
      products: productData
    });

  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};