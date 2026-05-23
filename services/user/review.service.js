import Review from "../../models/user/reviewModel.js";
import Product from "../../models/admin/productModel.js";
import Order from "../../models/user/orderModel.js";
import mongoose from "mongoose";

export const addReviewService = async (userId, productId, data, files) => {
    const { rating, title, comment } = data;

    if (!rating || rating < 1 || rating > 5) return { success: false, message: "Invalid rating" };
    if (!title || title.trim().length < 3) return { success: false, message: "Title must be at least 3 characters" };
    if (!comment || comment.trim().length < 10) return { success: false, message: "Comment must be at least 10 characters" };

    const deliveredOrder = await Order.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        "items.productId": new mongoose.Types.ObjectId(productId),
        status: "Delivered"
    });

    if (!deliveredOrder) return { success: false, message: "Purchase product before reviewing" };

    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) return { success: false, message: "Review already added" };

    const images = files?.map(file => file.path) || [];

    const review = new Review({
        userId, productId, orderId: deliveredOrder._id, rating, title: title.trim(),
        comment: comment.trim(), images, verifiedPurchase: true, status: "pending"
    });

    await review.save();

    const ratingStats = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: "active" } },
        { $group: {
            _id: "$productId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 },
            fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }
        }}
    ]);

    if (ratingStats[0]) {
        await Product.findByIdAndUpdate(productId, { averageRating: ratingStats[0].averageRating.toFixed(1), totalReviews: ratingStats[0].totalReviews });
    }

    return { success: true, message: "Review added successfully", review };
};

export const getProductReviewsService = async (productId, page, sortType) => {
    const limit = 5;
    const skip = (page - 1) * limit;

    let sortOption = {};
    switch (sortType) {
        case "highest": sortOption = { rating: -1 }; break;
        case "lowest": sortOption = { rating: 1 }; break;
        case "oldest": sortOption = { createdAt: 1 }; break;
        default: sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({ productId, status: "active" })
        .populate("userId", "name profileImage").sort(sortOption).skip(skip).limit(limit);

    const totalReviews = await Review.countDocuments({ productId, status: "active" });

    const ratingStats = await Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: "active" } },
        { $group: {
            _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 },
            fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }
        }}
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };

    return {
        success: true, reviews, pagination: { currentPage: page, totalPages: Math.ceil(totalReviews / limit), totalReviews },
        ratingSummary: {
            averageRating: Number(stats.averageRating || 0).toFixed(1), totalReviews: stats.totalReviews,
            breakdown: { 5: stats.fiveStar, 4: stats.fourStar, 3: stats.threeStar, 2: stats.twoStar, 1: stats.oneStar }
        }
    };
};

export const markHelpfulService = async (userId, reviewId) => {
    const review = await Review.findById(reviewId);
    if (!review) return { success: false, message: "Review not found" };

    if (review.helpfulUsers.includes(userId)) return { success: false, message: "Already marked as helpful" };

    review.helpfulUsers.push(userId);
    review.helpfulCount += 1;
    await review.save();

    return { success: true, message: "Marked as helpful", helpfulCount: review.helpfulCount };
};

export const editReviewService = async (userId, reviewId, data, files) => {
    const review = await Review.findById(reviewId);
    if (!review) return { success: false, statusCode: 404, message: "Review not found" };
    if (review.userId.toString() !== userId.toString()) return { success: false, statusCode: 403, message: "Unauthorized" };

    const { rating, title, comment } = data;
    if (!rating || rating < 1 || rating > 5) return { success: false, message: "Invalid rating" };
    if (!title || title.trim().length < 3) return { success: false, message: "Title must be at least 3 characters" };
    if (!comment || comment.trim().length < 10) return { success: false, message: "Comment must be at least 10 characters" };

    const newImages = files?.map(file => file.path) || [];

    review.rating = rating;
    review.title = title.trim();
    review.comment = comment.trim();
    review.isEdited = true;

    if (newImages.length > 0) review.images = newImages;

    await review.save();

    const stats = await Review.aggregate([
        { $match: { productId: review.productId, status: "active" } },
        { $group: { _id: "$productId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(review.productId, { averageRating: stats[0].averageRating.toFixed(1), totalReviews: stats[0].totalReviews });
    }

    return { success: true, message: "Review updated successfully", review };
};

export const deleteReviewService = async (userId, reviewId) => {
    const review = await Review.findById(reviewId);
    if (!review) return { success: false, statusCode: 404, message: "Review not found" };
    if (review.userId.toString() !== userId.toString()) return { success: false, statusCode: 403, message: "Unauthorized" };

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    const stats = await Review.aggregate([
        { $match: { productId: productId, status: "active" } },
        { $group: { _id: "$productId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    if (stats.length === 0) {
        await Product.findByIdAndUpdate(productId, { averageRating: 0, totalReviews: 0 });
    } else {
        await Product.findByIdAndUpdate(productId, { averageRating: stats[0].averageRating.toFixed(1), totalReviews: stats[0].totalReviews });
    }

    return { success: true, message: "Review deleted successfully" };
};
