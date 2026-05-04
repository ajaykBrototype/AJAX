import Variant from "../../models/admin/variantModel.js";
import Product from "../../models/admin/productModel.js";

export const loadVariantPage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const search = req.query.search || "";
    const status = req.query.status || "all";

    let filter = { productId: id };

    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: "i" } },
        { color: { $regex: search, $options: "i" } }
      ];
    }
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const product = await Product.findById(id)
      .populate("category")
      .populate("subcategory");
    const variants = await Variant.find(filter).sort({ isDefault: -1, createdAt: -1 });
    
    res.render("admin/variants", {
      product,
      variants,
      search,
      status
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

export const toggleVariantStatus = async (req, res) => {
  try {
     const isActive = req.body.isActive === true;

    const variant = await Variant.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    res.json({
      success: true,
      isActive: variant.isActive
    });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const setDefaultVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const variant = await Variant.findById(variantId);
    
    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    // Unset default for all variants of this product
    await Variant.updateMany(
      { productId: variant.productId },
      { isDefault: false }
    );

    // Set the selected one as default
    variant.isDefault = true;
    await variant.save();

    res.json({ success: true, message: "Default variant updated" });

  } catch (err) {
    console.error("Error setting default variant:", err);
    res.json({ success: false, message: "Server error" });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const deleted = await Variant.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.json({ success: false, message: "Not found" });
    }

    res.status(200).json({ success: true });

  } catch (err) {
    res.json({ success: false });
  }
};

export const loadEditVariantPage =async(req,res)=>{
  try{
     const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.redirect("/admin/products");
    }
     const product = await Product.findById(variant.productId);
    res.render("admin/editVariant", {
      variant,
      product
    });
  }catch(err){
     console.log(err);
    res.redirect("/admin/products");
  }
}

export const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { color, size, price, stock, sku } = req.body;

    let existingImages = [];
    if (req.body.existingImages) {
      existingImages = JSON.parse(req.body.existingImages);
    }


    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file =>
        file.path.replace(/\\/g, "/").replace("public", "")
      );
    }


    const finalImages = [...existingImages, ...newImages];


    if (finalImages.length < 3) {
      return res.json({
        success: false,
        message: "Minimum 3 images required"
      });
    }

    const updatedVariant = await Variant.findByIdAndUpdate(
      id,
      {
        color,
        size,
        price,
        stock,
        sku,
        images: finalImages
      },
      { new: true }
    );

    if (!updatedVariant) {
      return res.json({
        success: false,
        message: "Variant not found"
      });
    }

    res.json({
      success: true,
      redirectUrl: `/admin/products/${updatedVariant.productId}/variants`
    });

  } catch (err) {
    console.error("Update Variant Error:", err);
    res.json({
      success: false,
      message: "Update failed"
    });
  }
};