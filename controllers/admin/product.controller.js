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
    const { name, category, subcategory, material, description, careGuide } = req.body;

    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });

    if (!name || !category || !subcategory) {
      return res.render("admin/addProduct", {
        error: "Required fields missing",
        categories,
        subCategories
      });
    }

    await createProductService({
      name,
      category,
      subcategory,
      material,
      description,
      careGuide
    });

    res.redirect("/admin/products");

  } catch (err) {
    console.log(err);

    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });

    res.render("admin/addProduct", {
      error: "Something went wrong",
      categories,
      subCategories
    });
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category").populate("subcategory");
    if (!product) {
      return res.redirect("/admin/products");
    }

    // Fetch all variants to show in details
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
