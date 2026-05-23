import * as reviewService from "../../services/admin/review.service.js";

export const getPendingReviews = async (req, res) => {
    try {
        const reviews = await reviewService.getPendingReviewsService();
        res.render("admin/reviews", { reviews });
    } catch (error) {
        console.log(error);
        res.redirect("/admin/dashboard");
    }
};

export const approveReview = async (req, res) => {
    try {
        const result = await reviewService.approveReviewService(req.params.reviewId);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const rejectReview = async (req, res) => {
    try {
        const result = await reviewService.rejectReviewService(req.params.reviewId);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
