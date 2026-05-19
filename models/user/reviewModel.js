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
        trim: true,
        maxlength: 100
    },

    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    images: [{
        type: String
    }],

    verifiedPurchase: {
        type: Boolean,
        default: false
    },

    helpfulCount: {
        type: Number,
        default: 0
    },

    helpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    adminReply: {
        message: String,
        repliedAt: Date
    },

    isEdited: {
        type: Boolean,
        default: false
    },

    reportedCount: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["pending", "active", "hidden", "rejected"],
        default: "pending"
    }

}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);