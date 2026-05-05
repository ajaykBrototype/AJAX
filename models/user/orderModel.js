import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      variantId: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],

  address: {
    name: String,
    phone: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "RAZORPAY"],
    default: "COD"
  },

  totalAmount: Number,

  status: {
    type: String,
    enum: ["Pending", "Placed", "Cancelled"],
    default: "Placed"
  }

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);