import Review from "../../models/user/reviewModel.js";
import Product from "../../models/admin/productModel.js";
import mongoose from "mongoose";

export const getPendingReviewsService = async () => {
    return await Review.find()
        .populate("userId", "name email profileImage")
        .populate("productId", "name")
        .sort({ createdAt: -1 });
};

export const approveReviewService = async (reviewId) => {
    const review = await Review.findByIdAndUpdate(
        reviewId,
        { status: "active" },
        { new: true }
    );

    if (!review) return { success: false, statusCode: 404, message: "Review not found" };

    const ratingStats = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(review.productId), status: "active" } },
        { $group: { _id: "$productId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    if (ratingStats.length > 0) {
        await Product.findByIdAndUpdate(review.productId, {
            averageRating: ratingStats[0].averageRating.toFixed(1),
            totalReviews: ratingStats[0].totalReviews
        });
    }

    return { success: true, review, message: "Review approved" };
};

export const rejectReviewService = async (reviewId) => {
    const review = await Review.findByIdAndUpdate(
        reviewId,
        { status: "rejected" },
        { new: true }
    );

    if (!review) return { success: false, statusCode: 404, message: "Review not found" };

    return { success: true, review, message: "Review rejected" };
};
