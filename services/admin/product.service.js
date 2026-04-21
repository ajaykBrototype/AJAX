import Product from "../../models/admin/productModel.js";

export const createProductService = async (data) => {
  return await Product.create(data);
};

export const toggleProductService = async (id) => {
  const product = await Product.findById(id);
  if (!product) return { success: false, message: "Product not found" };
  
  product.isActive = !product.isActive;
  await product.save();
  
  return { 
    success: true, 
    isActive: product.isActive,
    message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`
  };
};

export const getAllProductsService = async (filter, skip, limit) => {
  return await Product.find(filter)
    .populate("category")
    .populate("subcategory")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};