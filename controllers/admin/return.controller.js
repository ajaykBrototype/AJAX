import * as returnService from "../../services/admin/return.service.js";

export const loadReturnManagement = async (req, res) => {
    try {
        const currentStatus = req.query.status || "all";
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        
        const data = await returnService.getReturnManagementDataService(currentStatus, search, page, limit);

        res.render("admin/returnManagement", data);
    } catch (err) {
        console.log("ADMIN RETURN MANAGEMENT ERROR:", err);
        res.redirect("/admin/orders");
    }
};

export const loadReturnDetails = async (req, res) => {
    try {
        const data = await returnService.getReturnDetailsService(req.params.id);

        if (!data) {
            return res.redirect("/admin/returns");
        }

        res.render("admin/returnDetails", data);
    } catch (err) {
        console.log("ADMIN RETURN DETAILS ERROR:", err);
        res.redirect("/admin/returns");
    }
};

export const approveReturn = async (req, res) => {
    try {
        const result = await returnService.approveReturnService(req.params.id);
        if (!result.success && result.statusCode === 404) return res.status(404).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const rejectReturn = async (req, res) => {
    try {
        const result = await returnService.rejectReturnService(req.params.id, req.body.reason);
        if (!result.success && result.statusCode === 404) return res.status(404).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const schedulePickup = async (req, res) => {
    try {
        const { pickupDate, pickupTime } = req.body;
        const result = await returnService.schedulePickupService(req.params.id, pickupDate, pickupTime);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};

export const markPickedUp = async (req, res) => {
    try {
        const result = await returnService.markPickedUpService(req.params.id);
        if (!result.success) return res.status(result.statusCode || 400).json(result);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
};