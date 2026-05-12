import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    discountType: {
        type: String,
        enum: ["flat", "percentage"],
        required: true
    },

    discountAmount: {
        type: Number,
        required: true
    },

    minOrderAmount: {
        type: Number,
        required: true
    },

    maxDiscount: {
        type: Number,
        default: 0
    },

    usageLimit: {
        type: Number,
        default: 1
    },

    usedCount: {
        type: Number,
        default: 0
    },

    startDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "active"
    }

}, { timestamps: true });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;