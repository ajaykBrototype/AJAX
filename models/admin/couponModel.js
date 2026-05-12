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

    minOrder: {
        type: Number,
        required: true
    },

    maxDiscount: {
        type: Number,
        default: 0
    },

    maxUsage: {
        type: Number,
        default: 1
    },

    usageCount: {
        type: Number,
        default: 0
    },

    userLimit: {
        type: Number,
        default: 1
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }

}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);