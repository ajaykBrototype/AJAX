import Review from "../../models/user/reviewModel.js";
import Product from "../../models/admin/productModel.js";
import Order from "../../models/user/orderModel.js";

export const addReview = async (req, res) => {

    try {

        const userId = req.session.userId;

        const { productId } = req.params;

        const {
            rating,
            title,
            comment
        } = req.body;

        

        const deliveredOrder = await Order.findOne({
            userId,
            "products.productId": productId,
            orderStatus: "Delivered"
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

        

        const review = new Review({

            userId,
            productId,
            orderId: deliveredOrder._id,

            rating,
            title,
            comment,

            verifiedPurchase: true

        });

        await review.save();


        const reviews = await Review.find({
            productId,
            status: "active"
        });

        const totalReviews = reviews.length;

        const averageRating = reviews.reduce(
            (acc, item) => acc + item.rating,
            0
        ) / totalReviews;

        await Product.findByIdAndUpdate(productId, {

            averageRating: averageRating.toFixed(1),
            totalReviews

        });

        res.status(200).json({
            success: true,
            message: "Review added successfully"
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

        const reviews = await Review.find({
            productId,
            status: "active"
        })

        .populate("userId", "name")

        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reviews
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });

    }

};