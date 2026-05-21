import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Offer from "../../models/admin/offerModel.js";

import {
  createProductService,
  getAllProductsService,
  toggleProductService
} from "../../services/admin/product.service.js";

export const toggleProduct = async (req, res) => {
  try {
    const result = await toggleProductService(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error during toggle" });
  }
};

export const loadProductPage = async (req, res) => {
  try {
    const { search, category, subcategory, status, page: pageQuery } = req.query;
    const page = parseInt(pageQuery) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;


    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });

    const total = await Product.countDocuments(); // Keep for future dashboard stats if needed


    let filter = {};


    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } } // Note: Assuming sku field exists based on EJS, if not it will just return nothing for SKU match
      ];
    }


    if (category && category !== "All Categories") {
      filter.category = category;
    }

    if (subcategory && subcategory !== "All Subcategories") {
      filter.subcategory = subcategory;
    }


    if (status && status !== "All Status") {
      filter.isActive = status === "active";
    }


    const productsRaw = await getAllProductsService(filter, skip, limit);
    const totalMatchingProducts = await Product.countDocuments(filter);

    // Attach default variant and offer data to each product
    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    const products = await Promise.all(productsRaw.map(async (prod) => {
      const allVariants = await Variant.find({ productId: prod._id }).lean();
      const totalStock = allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const defaultVariant = allVariants.find(v => v.isDefault) || allVariants[0];

      // Compute best offer for this product
      let finalPrice = defaultVariant?.price || null;
      let bestOffer = null;
      if (defaultVariant) {
        const price = defaultVariant.price;
        const productId = prod._id.toString();
        const categoryId = prod.category?._id?.toString() || prod.category?.toString();
        const applicable = activeOffers.filter(o => {
          if (o.applicableTo === 'product' && o.targetProduct?.toString() === productId) return true;
          if (o.applicableTo === 'category' && o.targetCategory?.toString() === categoryId) return true;
          return false;
        }).filter(o => !o.minOrderValue || price >= o.minOrderValue);
        let maxD = 0;
        applicable.forEach(o => {
          let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
          if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
          if (d > maxD) { maxD = d; bestOffer = o; }
        });
        if (bestOffer) finalPrice = Math.round(price - maxD);
      }

      return {
        ...prod.toObject(),
        totalStock,
        finalPrice,
        bestOffer,
        variant: defaultVariant ? {
          price: defaultVariant.price,
          stock: defaultVariant.stock,
          images: defaultVariant.images
        } : null
      };
    }));

    res.render("admin/products", {
      products,
      categories,
      subCategories,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalMatchingProducts / limit),
      totalMatchingProducts: totalMatchingProducts,
      search: search || "",
      selectedCategory: category || "",
      selectedSubCategory: subcategory || "",
      selectedStatus: status || ""
    });
  } catch (err) {
    console.error("Error loading product page:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const loadAddProductPage = async (req, res) => {
  const categories = await Category.find({ isActive: true });
  const subCategories = await SubCategory.find({ isActive: true });

  res.render("admin/addProduct", {
    categories,
    subCategories
  });
};
export const addProduct = async (req, res) => {
  try {
    const {
      name, category, subcategory, material, description, careGuide,
      color, sku, price, stock, size
    } = req.body;

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    if (!name || !category || !subcategory || !sku || !price || !color || !size) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const existingVariant = await Variant.findOne({ sku });
    if (existingVariant) {
      return res.status(400).json({ success: false, message: "SKU already exists" });
    }


    const newProduct = await Product.create({
      name,
      category,
      subcategory,
      material,
      description,
      careGuide
    });

    // 3. Create Default Variant
    await Variant.create({
      productId: newProduct._id,
      color,
      sku,
      price,
      regularPrice: price,
      salePrice: price,
      stock,
      size,
      images,
      isDefault: true
    });

    res.json({ success: true, message: "Product and primary variant created successfully" });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Something went wrong" });
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category").populate("subcategory");
    if (!product) {
      return res.redirect("/admin/products");
    }

    const variants = await Variant.find({ productId: product._id });

    // Support variant selection via query param (?variant=ID)
    const selectedVariantId = req.query.variant;
    let defaultVariant;

    if (selectedVariantId) {
      defaultVariant = variants.find(v => v._id.toString() === selectedVariantId);
    }

    if (!defaultVariant) {
      defaultVariant = variants.find(v => v.isDefault) || variants[0];
    }

    // Compute best active offer for this product/category
    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    let bestOffer = null;
    let finalPrice = defaultVariant ? defaultVariant.price : null;

    if (defaultVariant) {
      const price = defaultVariant.price;
      const productId = product._id.toString();
      const categoryId = product.category?._id?.toString() || product.category?.toString();

      const applicable = activeOffers.filter(o => {
        if (o.applicableTo === 'product' && o.targetProduct?.toString() === productId) return true;
        if (o.applicableTo === 'category' && o.targetCategory?.toString() === categoryId) return true;
        return false;
      }).filter(o => !o.minOrderValue || price >= o.minOrderValue);

      let maxD = 0;
      applicable.forEach(o => {
        let d = o.discountMode === 'percentage'
          ? (price * o.discountValue) / 100
          : o.discountValue;
        if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
        if (d > maxD) { maxD = d; bestOffer = o; }
      });

      if (bestOffer) finalPrice = Math.round(price - maxD);
    }

    res.render("admin/productDetails", {
      product,
      variants,
      defaultVariant,
      bestOffer,
      finalPrice
    });

  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
}


export const loadEditProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });

    res.render("admin/editProduct", {
      product,
      categories,
      subCategories
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
}

export const updateProduct = async (req, res) => {
  try {
    const { name, category, subcategory, description, material, careGuide, isActive } = req.body;

    if (!name || !category || !subcategory) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
      name,
      category,
      subcategory,
      description,
      material,
      careGuide,
      isActive: isActive === "true" || isActive === true
    }, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("DELETE HIT ✅", req.params.id);
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};