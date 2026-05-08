
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


    images: [
        {
            type: String
        }
    ],

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



    adminNote: {
        type: String,
        default: ""
    },

    rejectionReason: {
        type: String,
        default: ""
    },



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



    requestedAt: {
        type: Date,
        default: Date.now
    },

    approvedAt: Date,

    rejectedAt: Date,

    pickupDate: Date,

    pickupTime: String,

    pickupStatus: {
      type: String,
      enum: [
        "Pending",
        "Scheduled",
        "Picked Up"
    ],
    default: "Pending"
},


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

