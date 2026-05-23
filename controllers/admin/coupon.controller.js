import * as couponService from "../../services/admin/coupon.service.js";

export const loadCouponPage = async (req, res) => {
    try {
        const search = req.query.search || "";
        const status = req.query.status || "";
        const sort = req.query.sort || "newest";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const data = await couponService.getCouponPageDataService(search, status, sort, page, limit);

        res.render("admin/coupons", {
            ...data,
            currentPath: "/admin/coupons"
        });
    } catch (error) {
        console.error("Error loading coupon page:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const createCoupon = async (req, res) => {
    try {
        const result = await couponService.createCouponService(req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(result.statusCode).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const toggleCouponStatus = async (req, res) => {
    try {
        const result = await couponService.toggleCouponStatusService(req.params.id);
        if (!result.success && result.statusCode === 404) return res.status(404).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const result = await couponService.updateCouponService(req.params.id, req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const result = await couponService.deleteCouponService(req.params.id);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

export const getSingleCoupon = async (req, res) => {
    try {
        const result = await couponService.getSingleCouponService(req.params.id);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};