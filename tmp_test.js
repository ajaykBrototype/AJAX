import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Category from "./models/admin/categoryModel.js";
import SubCategory from "./models/admin/subCategoryModel.js";
import Product from "./models/admin/productModel.js";
import Variant from "./models/admin/variantModel.js";

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const targetCategory = await Category.findOne({ name: { $regex: new RegExp(`^sample$`, "i") } });
  if (!targetCategory) return console.log("Category 'sample' not found");
  console.log("Category:", targetCategory);
  
  const subCategories = await SubCategory.find({ category: targetCategory._id });
  console.log("SubCategories:", subCategories);

  const subIds = subCategories.filter(s => s.isActive).map(s => s._id);

  const products = await Product.find({ category: targetCategory._id, isActive: true });
  console.log("All active products in this category regardless of sub:", products.length);

  const filteredProducts = await Product.find({ 
    category: targetCategory._id, 
    isActive: true, 
    subcategory: { $in: subIds } 
  });
  console.log("Filtered products (with active subcategory):", filteredProducts.length);
  
  for (let p of filteredProducts) {
    const vars = await Variant.find({ productId: p._id, isActive: true });
    console.log(`Product ${p.name} has ${vars.length} active variants`);
  }

  process.exit(0);
}
test();
