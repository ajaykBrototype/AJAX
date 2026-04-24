import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Variant",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }

}, { _id: true });

const cartSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [cartItemSchema],

  totalPrice: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);