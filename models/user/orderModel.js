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
      size:String,
      image: String,
      status: {
        type: String,
        default: "Placed"
      },
      cancellationReason: String,
      cancellationNote: String
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
    enum: ["COD", "RAZORPAY", "WALLET"],
    default: "COD"
  },

  totalAmount: Number,
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    uppercase: true
  },

  status: {
    type: String,
    enum: [ 
      "Pending",
      "Placed",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled"
    ],
    default: "Placed"
  },
   statusHistory: [
    {
      status: {
        type: String
      },

      updatedAt: {
        type: Date,
        default: Date.now
      },
      reason: String,
      note: String
    }
  ],
  cancellationReason: String,
  cancellationNote: String

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);