import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    comment: {
        type: String,
        required: true,
        trim: true
    },

    verifiedPurchase: {
        type: Boolean,
        default: false
    },

    helpfulCount: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["active", "hidden"],
        default: "active"
    }

}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);