// models/admin/productModel.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true
  },

  material: { type: String },

  description: { type: String },
  careGuide: { type: String },

  isActive: { type: Boolean, default: true }

}, { timestamps: true });

export default mongoose.model("Product", productSchema);