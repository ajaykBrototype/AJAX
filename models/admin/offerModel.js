import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({

    offerLabel: {
        type: String,
        required: true,
        trim: true
    },

    applicableTo: {
        type: String,
        enum: ["product", "category"],
        required: true
    },

    targetProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null
    },

    targetCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },

    discountMode: {
        type: String,
        enum: ["percentage", "flat"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true
    },

    maxDiscountCap: {
        type: Number,
        default: null
    },

    minOrderValue: {
        type: Number,
        default: 0
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

offerSchema.index({
    applicableTo: 1,
    targetProduct: 1,
    targetCategory: 1,
    isActive: 1
});

export default mongoose.model("Offer", offerSchema);