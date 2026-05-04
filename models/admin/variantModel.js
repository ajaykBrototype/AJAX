import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  color: {
    type: String,
    required: true
  },

  size: {
    type: String
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },

  price: {
    type: Number,
    required: true
  },

  stock: {
    type: Number,
    default: 0
  },

  images: {
    type: [String],
    default: []
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
     type: Boolean, 
     default: false }

}, { timestamps: true });

export default mongoose.model("Variant", variantSchema);