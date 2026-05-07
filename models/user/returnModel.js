import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },



    /* =========================
       RETURN DETAILS
    ========================= */

    reason: {
        type: String,
        required: true,
        trim: true
    },

    condition: {
        type: String,
        required: true,
        trim: true
    },

    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },



    /* =========================
       IMAGES
    ========================= */

    images: [
        {
            type: String
        }
    ],



    /* =========================
       RETURN STATUS
    ========================= */

    status: {
        type: String,
        enum: [
            "Requested",
            "Approved",
            "Rejected",
            "Pickup Scheduled",
            "Picked Up",
            "Refund Processed"
        ],
        default: "Requested"
    },



    /* =========================
       ADMIN SECTION
    ========================= */

    adminNote: {
        type: String,
        default: ""
    },

    rejectionReason: {
        type: String,
        default: ""
    },



    /* =========================
       REFUND
    ========================= */

    refundAmount: {
        type: Number,
        required: true
    },

    refundStatus: {
        type: String,
        enum: [
            "Pending",
            "Processed"
        ],
        default: "Pending"
    },



    /* =========================
       TIMESTAMPS
    ========================= */

    requestedAt: {
        type: Date,
        default: Date.now
    },

    approvedAt: Date,

    rejectedAt: Date,

    pickedUpAt: Date,

    refundedAt: Date

},
{
    timestamps: true
});



const Return = mongoose.model(
    "Return",
    returnSchema
);

export default Return;