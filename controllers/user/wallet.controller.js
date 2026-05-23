import * as walletService from "../../services/user/wallet.service.js";

export const loadWalletPage = async (req, res) => {
    try {
        const data = await walletService.getWalletPageDataService(req.session.userId);
        res.render("user/wallet", data);
    } catch (err) {
        console.log(err);
        res.redirect("/pageNotFound");
    }
};

export const addMoneyToWallet = async (req, res) => {
    try {
        const result = await walletService.addMoneyToWalletService(req.session.userId, req.body.amount);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        return res.status(200).json(result);
    } catch (err) {
        console.log("WALLET ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const createWalletOrder = async (req, res) => {
    try {
        const result = await walletService.createWalletOrderService(req.body.amount);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const verifyWalletPayment = async (req, res) => {
    try {
        const result = await walletService.verifyWalletPaymentService(req.session.userId, req.body);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const loadreferral = async (req, res) => {
    try {
        const data = await walletService.getReferralDataService(req.session.userId);
        res.render("user/referral", data);
    } catch (err) {
        console.log(err);
        res.redirect("/profile");
    }
};