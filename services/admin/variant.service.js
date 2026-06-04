import Variant from "../../models/admin/variantModel.js";
import Product from "../../models/admin/productModel.js";

export const getVariantPageDataService = async (productId, search, status) => {
    let filter = { productId };

    if (search) {
        filter.$or = [
            { sku: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } }
        ];
    }
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const product = await Product.findById(productId).populate("category").populate("subcategory");
    let variants = await Variant.find(filter).sort({ isDefault: -1, createdAt: -1 }).lean();
    
    variants = variants.map(v => ({
        ...v,
        price: v.salePrice || v.regularPrice || v.price || 0
    }));

    return { product, variants, search, status };
};

export const getAddVariantPageDataService = async (productId) => {
    const product = await Product.findById(productId).populate("category").populate("subcategory");
    if (!product) return null;

    const firstVariant = await Variant.findOne({ productId });
    const previewImage = firstVariant?.images?.[0] || null;

    return { product: { ...product.toObject(), previewImage } };
};

export const addVariantService = async (data, imagePaths) => {
    const { productId, color, size, price, stock, sku } = data;

    if (!productId || !color || !price) {
        return { success: false, statusCode: 400, message: "Missing required fields (Color and Price are mandatory)" };
    }

    if (imagePaths.length < 3) {
        return { success: false, statusCode: 400, message: "A minimum of 3 images are required for a variant." };
    }

    // Check for duplicate color + size combination within this product
    const duplicateVariant = await Variant.findOne({
        productId,
        color: { $regex: new RegExp(`^${color.trim()}$`, "i") },
        size: size
    });

    if (duplicateVariant) {
        return { success: false, statusCode: 409, message: `A variant with color "${color}" and size "${size}" already exists for this product.` };
    }

    const existingVariantsCount = await Variant.countDocuments({ productId });

    await Variant.create({
        productId, color, size, price, regularPrice: price, salePrice: price, stock, sku, images: imagePaths,
        isDefault: existingVariantsCount === 0 
    });

    return { success: true, statusCode: 200, message: "Variant added successfully", redirectUrl: `/admin/products/${productId}/variants` };
};

export const toggleVariantStatusService = async (variantId, isActive) => {
    const variant = await Variant.findByIdAndUpdate(variantId, { isActive }, { new: true });
    if (!variant) return { success: false, message: "Variant not found" };
    
    return { success: true, isActive: variant.isActive };
};

export const setDefaultVariantService = async (variantId) => {
    const variant = await Variant.findById(variantId);
    if (!variant) return { success: false, message: "Variant not found" };

    await Variant.updateMany({ productId: variant.productId }, { isDefault: false });

    variant.isDefault = true;
    await variant.save();

    return { success: true, message: "Default variant updated" };
};

export const deleteVariantService = async (variantId) => {
    const deleted = await Variant.findByIdAndDelete(variantId);
    if (!deleted) return { success: false, message: "Not found" };
    return { success: true };
};

export const getEditVariantPageDataService = async (variantId) => {
    const variant = await Variant.findById(variantId);
    if (!variant) return null;
    const product = await Product.findById(variant.productId);
    return { variant, product };
};

export const updateVariantService = async (variantId, data, newImagePaths) => {
    const { color, size, price, stock, sku, existingImages } = data;

    let currentImages = [];
    if (existingImages) {
        currentImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    const finalImages = [...currentImages, ...newImagePaths];

    if (finalImages.length < 3) {
        return { success: false, statusCode: 400, message: "Minimum 3 images required" };
    }

    const updatedVariant = await Variant.findByIdAndUpdate(
        variantId,
        { color, size, price, regularPrice: price, salePrice: price, stock, sku, images: finalImages },
        { new: true }
    );

    if (!updatedVariant) return { success: false, statusCode: 404, message: "Variant not found" };

    return { success: true, statusCode: 200, redirectUrl: `/admin/products/${updatedVariant.productId}/variants` };
};
