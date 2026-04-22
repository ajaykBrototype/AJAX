import Variant from "../../models/admin/variantModel.js";
import Product from "../../models/admin/productModel.js";

export const loadVariantPage = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category")
      .populate("subcategory");
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

export const loadAddVariantPage = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category")
      .populate("subcategory");

    if (!product) {
      return res.redirect("/admin/products");
    }

    // Get the first variant image to use as a product preview thumbnail
    const firstVariant = await Variant.findOne({ productId: id });
    const previewImage = firstVariant?.images?.[0] || null;

    res.render("admin/addVariant", {
      product: { ...product.toObject(), previewImage }
    });

  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};

export const addVariant = async (req, res) => {
  try {
    const { productId, color, size, price, stock, sku } = req.body;

    if (!productId || !color || !price) {
      return res.status(400).json({ success: false, message: "Missing required fields (Color and Price are mandatory)" });
    }

    // Handle multiple images from req.files
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.path.replace(/\\/g, "/").replace("public", ""));
    }

    if (imagePaths.length < 3) {
      return res.status(400).json({ success: false, message: "A minimum of 3 images are required for a variant." });
    }

    // Check if it's the first variant, if so set as default
    const existingVariantsCount = await Variant.countDocuments({ productId });

    await Variant.create({
      productId,
      color,
      size,
      price,
      stock,
      sku,
      images: imagePaths,
      isDefault: existingVariantsCount === 0 // First variant is default
    });

    res.json({ 
      success: true, 
      message: "Variant added successfully", 
      redirectUrl: `/admin/products/${productId}/variants` 
    });

  } catch (err) {
    console.error("Error adding variant:", err);
    res.status(500).json({ success: false, message: err.message || "Error adding variant" });
  }
};