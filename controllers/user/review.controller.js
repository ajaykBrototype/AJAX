import * as reviewService from "../../services/user/review.service.js";

export const addReview = async (req, res) => {
    try {
        const result = await reviewService.addReviewService(req.session.userId, req.params.productId, req.body, req.files);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProductReviews = async (req, res) => {
    try {
        const result = await reviewService.getProductReviewsService(req.params.productId, parseInt(req.query.page) || 1, req.query.sort || "latest");
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const markHelpful = async (req, res) => {
    try {
        const result = await reviewService.markHelpfulService(req.session.userId, req.params.reviewId);
        if (!result.success) return res.status(400).json(result);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const editReview = async (req, res) => {
    try {
        const result = await reviewService.editReviewService(req.session.userId, req.params.reviewId, req.body, req.files);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const result = await reviewService.deleteReviewService(req.session.userId, req.params.reviewId);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};