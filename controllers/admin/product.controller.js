import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";

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

    // Attach default variant to each product for image promotion
    const products = await Promise.all(productsRaw.map(async (prod) => {
      const defaultVariant = await Variant.findOne({ productId: prod._id, isDefault: true }) || await Variant.findOne({ productId: prod._id });
      return {
        ...prod.toObject(),
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

    res.render("admin/productDetails", {
      product,
      variants,
      defaultVariant
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