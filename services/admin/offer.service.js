import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";
import Category from "../../models/admin/categoryModel.js";

export const getOffersPageDataService = async () => {
    const offers = await Offer.find().populate("targetProduct").populate("targetCategory").sort({ createdAt: -1 });
    const products = await Product.find({ isActive: true });
    const categories = await Category.find({ isActive: true });
    return { offers, products, categories };
};

export const getCreateOfferPageDataService = async () => {
    const products = await Product.find({ isActive: true });
    const categories = await Category.find({ isActive: true });
    return { products, categories };
};

export const createOfferService = async (data) => {
    const { offerLabel, applicableTo, targetProduct, targetCategory, discountMode, discountValue, maxDiscountCap, minOrderValue, startDate, endDate } = data;

    if (!offerLabel?.trim()) return { success: false, statusCode: 400, message: "Offer label required" };
    if (discountValue <= 0) return { success: false, statusCode: 400, message: "Invalid discount" };
    if (!startDate || !endDate) return { success: false, statusCode: 400, message: "Please select dates" };
    if (new Date(startDate) > new Date(endDate)) return { success: false, statusCode: 400, message: "Invalid dates" };

    const newOffer = new Offer({
        offerLabel,
        applicableTo,
        targetProduct: applicableTo === "product" ? targetProduct : null,
        targetCategory: applicableTo === "category" ? targetCategory : null,
        discountMode,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate
    });

    await newOffer.save();
    return { success: true, statusCode: 200, message: "Offer created successfully" };
};

export const updateOfferService = async (data) => {
    const { offerId, offerLabel, discountMode, discountValue, maxDiscountCap, minOrderValue, startDate, endDate } = data;

    const offer = await Offer.findById(offerId);
    if (!offer) return { success: false, statusCode: 404, message: "Offer not found" };

    offer.offerLabel = offerLabel;
    offer.discountMode = discountMode;
    offer.discountValue = discountValue;
    offer.maxDiscountCap = maxDiscountCap || null;
    offer.minOrderValue = minOrderValue || 0;
    offer.startDate = startDate;
    offer.endDate = endDate;

    await offer.save();
    return { success: true, statusCode: 200, message: "Offer updated successfully" };
};

export const deleteOfferService = async (id) => {
    const offer = await Offer.findById(id);
    if (!offer) return { success: false, statusCode: 404, message: "Offer not found" };

    await Offer.findByIdAndDelete(id);
    return { success: true, statusCode: 200, message: "Offer deleted successfully" };
};

export const toggleOfferStatusService = async (id) => {
    const offer = await Offer.findById(id);
    if (!offer) return { success: false, statusCode: 404, message: "Offer not found" };

    offer.isActive = !offer.isActive;
    await offer.save();
    
    return { success: true, statusCode: 200, message: `Offer ${offer.isActive ? "activated" : "deactivated"}` };
};
