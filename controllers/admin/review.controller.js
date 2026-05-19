import Review from "../../models/user/reviewModel.js";
import Product from "../../models/admin/productModel.js";
import mongoose from "mongoose";

// GET all reviews page for admin
export const getPendingReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("userId", "name email profileImage")
            .populate("productId", "name")
            .sort({ createdAt: -1 });

        res.render("admin/reviews", { reviews });
    } catch (error) {
        console.log(error);
        res.redirect("/admin/dashboard");
    }
};

// PATCH approve a review
export const approveReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { status: "active" },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Recalculate product rating now that this review is active
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

        res.status(200).json({ success: true, message: "Review approved", review });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// PATCH reject a review
export const rejectReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { status: "rejected" },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, message: "Review rejected", review });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
