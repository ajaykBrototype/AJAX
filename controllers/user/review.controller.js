import Review from "../../models/user/reviewModel.js";
import Product from "../../models/admin/productModel.js";
import Order from "../../models/user/orderModel.js";
import mongoose from "mongoose";



export const addReview = async (req, res) => {

    try {

        const userId = req.session.userId;

        const { productId } = req.params;

        const {
            rating,
            title,
            comment
        } = req.body;



        // VALIDATIONS

        if (!rating || rating < 1 || rating > 5) {

            return res.status(400).json({
                success: false,
                message: "Invalid rating"
            });

        }

        if (!title || title.trim().length < 3) {

            return res.status(400).json({
                success: false,
                message: "Title must be at least 3 characters"
            });

        }

        if (!comment || comment.trim().length < 10) {

            return res.status(400).json({
                success: false,
                message: "Comment must be at least 10 characters"
            });

        }



        // CHECK PURCHASE

        const deliveredOrder = await Order.findOne({

            userId: new mongoose.Types.ObjectId(userId),

            "items.productId": new mongoose.Types.ObjectId(productId),

            status: "Delivered"

        });

        if (!deliveredOrder) {

            return res.status(400).json({
                success: false,
                message: "Purchase product before reviewing"
            });

        }

        const existingReview = await Review.findOne({
            userId,
            productId
        });

        if (existingReview) {

            return res.status(400).json({
                success: false,
                message: "Review already added"
            });

        }

        const images = req.files?.map(file => file.path) || [];


        const review = new Review({

            userId,

            productId,

            orderId: deliveredOrder._id,

            rating,

            title: title.trim(),

            comment: comment.trim(),

            images,

            verifiedPurchase: true,

            status: "pending"

        });

        await review.save();



        // RECALCULATE PRODUCT RATING

        const ratingStats = await Review.aggregate([

            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    status: "active"
                }
            },

            {
                $group: {

                    _id: "$productId",

                    averageRating: {
                        $avg: "$rating"
                    },

                    totalReviews: {
                        $sum: 1
                    },

                    fiveStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 5] }, 1, 0]
                        }
                    },

                    fourStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 4] }, 1, 0]
                        }
                    },

                    threeStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 3] }, 1, 0]
                        }
                    },

                    twoStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 2] }, 1, 0]
                        }
                    },

                    oneStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 1] }, 1, 0]
                        }
                    }

                }
            }

        ]);



        const stats = ratingStats[0];

        if (stats) {
            await Product.findByIdAndUpdate(productId, {

                averageRating: stats.averageRating.toFixed(1),

                totalReviews: stats.totalReviews

            });
        }



        res.status(201).json({

            success: true,

            message: "Review added successfully",

            review

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};





export const getProductReviews = async (req, res) => {

    try {

        const { productId } = req.params;



        // PAGINATION

        const page = parseInt(req.query.page) || 1;

        const limit = 5;

        const skip = (page - 1) * limit;



        // SORTING

        const sortType = req.query.sort || "latest";

        let sortOption = {};



        switch (sortType) {

            case "highest":
                sortOption = { rating: -1 };
                break;

            case "lowest":
                sortOption = { rating: 1 };
                break;

            case "oldest":
                sortOption = { createdAt: 1 };
                break;

            default:
                sortOption = { createdAt: -1 };

        }



        // GET REVIEWS

        const reviews = await Review.find({

            productId,

            status: "active"

        })

        .populate("userId", "name profileImage")

        .sort(sortOption)

        .skip(skip)

        .limit(limit);



        // TOTAL REVIEW COUNT

        const totalReviews = await Review.countDocuments({

            productId,

            status: "active"

        });



        // RATING SUMMARY

        const ratingStats = await Review.aggregate([

            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    status: "active"
                }
            },

            {
                $group: {

                    _id: null,

                    averageRating: {
                        $avg: "$rating"
                    },

                    totalReviews: {
                        $sum: 1
                    },

                    fiveStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 5] }, 1, 0]
                        }
                    },

                    fourStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 4] }, 1, 0]
                        }
                    },

                    threeStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 3] }, 1, 0]
                        }
                    },

                    twoStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 2] }, 1, 0]
                        }
                    },

                    oneStar: {
                        $sum: {
                            $cond: [{ $eq: ["$rating", 1] }, 1, 0]
                        }
                    }

                }
            }

        ]);



        const stats = ratingStats[0] || {

            averageRating: 0,
            totalReviews: 0,
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0

        };



        res.status(200).json({

            success: true,

            reviews,

            pagination: {

                currentPage: page,

                totalPages: Math.ceil(totalReviews / limit),

                totalReviews

            },

            ratingSummary: {

                averageRating: Number(stats.averageRating || 0).toFixed(1),

                totalReviews: stats.totalReviews,

                breakdown: {

                    5: stats.fiveStar,

                    4: stats.fourStar,

                    3: stats.threeStar,

                    2: stats.twoStar,

                    1: stats.oneStar

                }

            }

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};





export const markHelpful = async (req, res) => {

    try {

        const userId = req.session.userId;

        const { reviewId } = req.params;



        const review = await Review.findById(reviewId);

        if (!review) {

            return res.status(404).json({
                success: false,
                message: "Review not found"
            });

        }



        // CHECK ALREADY MARKED

        const alreadyMarked = review.helpfulUsers.includes(userId);

        if (alreadyMarked) {

            return res.status(400).json({
                success: false,
                message: "Already marked as helpful"
            });

        }



        // ADD USER

        review.helpfulUsers.push(userId);

        review.helpfulCount += 1;

        await review.save();



        res.status(200).json({

            success: true,

            message: "Marked as helpful",

            helpfulCount: review.helpfulCount

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};





export const editReview = async (req, res) => {

    try {

        const userId = req.session.userId;

        const { reviewId } = req.params;

        const {
            rating,
            title,
            comment
        } = req.body;



        const review = await Review.findById(reviewId);

        if (!review) {

            return res.status(404).json({
                success: false,
                message: "Review not found"
            });

        }



        // OWNER CHECK

        if (review.userId.toString() !== userId.toString()) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });

        }



        // VALIDATION

        if (!rating || rating < 1 || rating > 5) {

            return res.status(400).json({
                success: false,
                message: "Invalid rating"
            });

        }

        if (!title || title.trim().length < 3) {

            return res.status(400).json({
                success: false,
                message: "Title must be at least 3 characters"
            });

        }

        if (!comment || comment.trim().length < 10) {

            return res.status(400).json({
                success: false,
                message: "Comment must be at least 10 characters"
            });

        }



        // NEW IMAGES

        const newImages = req.files?.map(file => file.path) || [];



        // UPDATE REVIEW

        review.rating = rating;

        review.title = title.trim();

        review.comment = comment.trim();

        review.isEdited = true;



        // OPTIONAL IMAGE UPDATE

        if (newImages.length > 0) {

            review.images = newImages;

        }



        await review.save();



        // RECALCULATE PRODUCT RATING

        const stats = await Review.aggregate([

            {
                $match: {
                    productId: review.productId,
                    status: "active"
                }
            },

            {
                $group: {

                    _id: "$productId",

                    averageRating: {
                        $avg: "$rating"
                    },

                    totalReviews: {
                        $sum: 1
                    }

                }
            }

        ]);



        if (stats.length > 0) {

            await Product.findByIdAndUpdate(review.productId, {

                averageRating: stats[0].averageRating.toFixed(1),

                totalReviews: stats[0].totalReviews

            });

        }



        res.status(200).json({

            success: true,

            message: "Review updated successfully",

            review

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};





export const deleteReview = async (req, res) => {

    try {

        const userId = req.session.userId;

        const { reviewId } = req.params;



        const review = await Review.findById(reviewId);

        if (!review) {

            return res.status(404).json({
                success: false,
                message: "Review not found"
            });

        }



        // OWNER CHECK

        if (review.userId.toString() !== userId.toString()) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });

        }



        const productId = review.productId;



        // DELETE REVIEW

        await Review.findByIdAndDelete(reviewId);



        // RECALCULATE PRODUCT RATING

        const stats = await Review.aggregate([

            {
                $match: {
                    productId: productId,
                    status: "active"
                }
            },

            {
                $group: {

                    _id: "$productId",

                    averageRating: {
                        $avg: "$rating"
                    },

                    totalReviews: {
                        $sum: 1
                    }

                }
            }

        ]);



        // IF NO REVIEWS

        if (stats.length === 0) {

            await Product.findByIdAndUpdate(productId, {

                averageRating: 0,

                totalReviews: 0

            });

        } else {

            await Product.findByIdAndUpdate(productId, {

                averageRating: stats[0].averageRating.toFixed(1),

                totalReviews: stats[0].totalReviews

            });

        }



        res.status(200).json({

            success: true,

            message: "Review deleted successfully"

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

};