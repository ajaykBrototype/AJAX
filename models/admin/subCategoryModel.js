import mongoose from "mongoose";
import { lowercase } from "zod";

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    lowercase:true,
    trim: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

subCategorySchema.index(
  { category: 1, name: 1 },
  { unique: true }
);

export default mongoose.model("SubCategory", subCategorySchema);