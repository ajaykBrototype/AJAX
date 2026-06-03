import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";
import Category from "../../models/admin/categoryModel.js";
import Variant from "../../models/admin/variantModel.js";

export const getOffersPageDataService = async () => {
    const offers = await Offer.find().populate("targetProduct").populate("targetCategory").sort({ createdAt: -1 });
    const rawProducts = await Product.find({ isActive: true }).lean();
    const categories = await Category.find({ isActive: true });

    // Attach lowest variant price to each product for frontend validation
    const products = await Promise.all(rawProducts.map(async (p) => {
        const lowestVariant = await Variant.findOne({ productId: p._id }).sort({ price: 1 }).lean();
        return { ...p, lowestPrice: lowestVariant ? lowestVariant.price : 0 };
    }));

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

    if (discountMode === "flat") {
        const flatDiscount = Number(discountValue);
        if (applicableTo === "product") {
            const lowestVariant = await Variant.findOne({ productId: targetProduct }).sort({ price: 1 });
            if (lowestVariant && flatDiscount >= lowestVariant.price) {
                return { success: false, statusCode: 400, message: `Flat discount (₹${flatDiscount}) cannot be equal to or more than the product price (₹${lowestVariant.price})` };
            }
        } else if (applicableTo === "category") {
            const productsInCat = await Product.find({ category: targetCategory }).select("_id");
            const productIds = productsInCat.map(p => p._id);
            const lowestVariant = await Variant.findOne({ productId: { $in: productIds } }).sort({ price: 1 });
            if (lowestVariant && flatDiscount >= lowestVariant.price) {
                return { success: false, statusCode: 400, message: `Flat discount (₹${flatDiscount}) cannot be equal to or more than the lowest product price in this category (₹${lowestVariant.price})` };
            }
        }
    }

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

    if (discountMode === "flat") {
        const flatDiscount = Number(discountValue);
        if (offer.applicableTo === "product" && offer.targetProduct) {
            const lowestVariant = await Variant.findOne({ productId: offer.targetProduct }).sort({ price: 1 });
            if (lowestVariant && flatDiscount >= lowestVariant.price) {
                return { success: false, statusCode: 400, message: `Flat discount (₹${flatDiscount}) cannot be equal to or more than the product price (₹${lowestVariant.price})` };
            }
        } else if (offer.applicableTo === "category" && offer.targetCategory) {
            const productsInCat = await Product.find({ category: offer.targetCategory }).select("_id");
            const productIds = productsInCat.map(p => p._id);
            const lowestVariant = await Variant.findOne({ productId: { $in: productIds } }).sort({ price: 1 });
            if (lowestVariant && flatDiscount >= lowestVariant.price) {
                return { success: false, statusCode: 400, message: `Flat discount (₹${flatDiscount}) cannot be equal to or more than the lowest product price in this category (₹${lowestVariant.price})` };
            }
        }
    }

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
