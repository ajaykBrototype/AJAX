import * as offerService from "../../services/admin/offer.service.js";

export const loadOffers = async (req, res) => {
   try {
       const data = await offerService.getOffersPageDataService();
       res.render("admin/offers", data);
   } catch (err) {
        console.log(err);
        res.redirect("/admin/pageerror");
   }
};

export const loadCreateOffer = async (req, res) => {
    try {
        const data = await offerService.getCreateOfferPageDataService();
        res.render("admin/create-offer", data);
    } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror");
    }
};

export const createOffer = async (req, res) => {
    try {
        const result = await offerService.createOfferService(req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(result.statusCode).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateOffer = async (req, res) => {
    try {
        const result = await offerService.updateOfferService(req.body);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(result.statusCode).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        const result = await offerService.deleteOfferService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(result.statusCode).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const toggleOfferStatus = async (req, res) => {
    try {
        const result = await offerService.toggleOfferStatusService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(result.statusCode).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};