import Variant from "../../models/admin/variantModel.js";
import Product from "../../models/admin/productModel.js";

export const loadVariantPage = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    const variants = await Variant.find({ productId: id });

    res.render("admin/variants", {
      product,
      variants
    });

  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};