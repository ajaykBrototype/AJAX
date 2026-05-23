import * as checkoutService from "../../services/user/checkout.service.js";

export const loadCheckoutPage = async (req, res) => {
    try {
        const data = await checkoutService.getCheckoutPageDataService(req.session.userId, req.query.addressId);
        
        if (!data) return res.redirect("/cart");

        res.render("user/checkout", data);
    } catch (err) {
        console.log("CHECKOUT ERROR:", err);
        res.redirect("/cart");
    }
};

export const saveAddress = async (req, res) => {
    try {
        await checkoutService.saveAddressService(req.session.userId, req.body);
        res.redirect("/checkout");
    } catch (err) {
        console.log("SAVE ADDRESS ERROR:", err);
        res.redirect("/checkout");
    }
};

export const getAvailableCoupons = async (req, res) => {
    try {
        const result = await checkoutService.getAvailableCouponsService(req.session.userId, Number(req.query.subtotal));
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const applyCoupon = async (req, res) => {
    try {
        const result = await checkoutService.applyCouponService(req.session.userId, req.body.code, req.body.subtotal);
        if (!result.success) return res.json(result);
        res.json(result);
    } catch (err) {
        console.log("APPLY COUPON ERROR:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
