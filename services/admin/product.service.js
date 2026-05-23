import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Offer from "../../models/admin/offerModel.js";

export const getProductPageDataService = async (search, category, subcategory, status, page, limit) => {
    const skip = (page - 1) * limit;

    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });

    let filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } }
        ];
    }

    if (category && category !== "All Categories") filter.category = category;
    if (subcategory && subcategory !== "All Subcategories") filter.subcategory = subcategory;
    if (status && status !== "All Status") filter.isActive = status === "active";

    const productsRaw = await Product.find(filter)
        .populate("category")
        .populate("subcategory")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const totalMatchingProducts = await Product.countDocuments(filter);

    const today = new Date();
    const activeOffers = await Offer.find({
        isActive: true,
        startDate: { $lte: today },
        endDate: { $gte: today }
    }).lean();

    const products = await Promise.all(productsRaw.map(async (prod) => {
        const allVariants = await Variant.find({ productId: prod._id }).lean();
        const totalStock = allVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const defaultVariant = allVariants.find(v => v.isDefault) || allVariants[0];

        let finalPrice = defaultVariant?.price || null;
        let bestOffer = null;
        if (defaultVariant) {
            const price = defaultVariant.price;
            const productId = prod._id.toString();
            // Optional chaining fix:
            let categoryId = null;
            if (prod.category) {
                // If it's populated it has _id, else it's an ObjectId string
                categoryId = prod.category._id ? prod.category._id.toString() : prod.category.toString();
            }
            
            const applicable = activeOffers.filter(o => {
                if (o.applicableTo === 'product' && o.targetProduct?.toString() === productId) return true;
                if (o.applicableTo === 'category' && o.targetCategory?.toString() === categoryId) return true;
                return false;
            }).filter(o => !o.minOrderValue || price >= o.minOrderValue);

            let maxD = 0;
            applicable.forEach(o => {
                let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
                if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
                if (d > maxD) { maxD = d; bestOffer = o; }
            });
            if (bestOffer) finalPrice = Math.round(price - maxD);
        }

        return {
            ...prod.toObject(),
            totalStock,
            finalPrice,
            bestOffer,
            variant: defaultVariant ? { price: defaultVariant.price, stock: defaultVariant.stock, images: defaultVariant.images } : null
        };
    }));

    return {
        products,
        categories,
        subCategories,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalMatchingProducts / limit),
        totalMatchingProducts,
        search: search || "",
        selectedCategory: category || "",
        selectedSubCategory: subcategory || "",
        selectedStatus: status || ""
    };
};

export const getAddProductPageDataService = async () => {
    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });
    return { categories, subCategories };
};

export const createProductWithVariantService = async (data, images) => {
    const { name, category, subcategory, material, description, careGuide, color, sku, price, stock, size } = data;

    if (!name || !category || !subcategory || !sku || !price || !color || !size) {
        return { success: false, statusCode: 400, message: "Required fields missing" };
    }

    const existingVariant = await Variant.findOne({ sku });
    if (existingVariant) {
        return { success: false, statusCode: 400, message: "SKU already exists" };
    }

    const newProduct = await Product.create({ name, category, subcategory, material, description, careGuide });

    await Variant.create({
        productId: newProduct._id,
        color, sku, price, regularPrice: price, salePrice: price, stock, size, images, isDefault: true
    });

    return { success: true, statusCode: 200, message: "Product and primary variant created successfully" };
};

export const getProductDetailsService = async (id, selectedVariantId) => {
    const product = await Product.findById(id).populate("category").populate("subcategory");
    if (!product) return null;

    const variants = await Variant.find({ productId: product._id });

    let defaultVariant;
    if (selectedVariantId) {
        defaultVariant = variants.find(v => v._id.toString() === selectedVariantId);
    }
    if (!defaultVariant) {
        defaultVariant = variants.find(v => v.isDefault) || variants[0];
    }

    const today = new Date();
    const activeOffers = await Offer.find({
        isActive: true,
        startDate: { $lte: today },
        endDate: { $gte: today }
    }).lean();

    let bestOffer = null;
    let finalPrice = defaultVariant ? defaultVariant.price : null;

    if (defaultVariant) {
        const price = defaultVariant.price;
        const productId = product._id.toString();
        let categoryId = null;
        if (product.category) {
            categoryId = product.category._id ? product.category._id.toString() : product.category.toString();
        }

        const applicable = activeOffers.filter(o => {
            if (o.applicableTo === 'product' && o.targetProduct?.toString() === productId) return true;
            if (o.applicableTo === 'category' && o.targetCategory?.toString() === categoryId) return true;
            return false;
        }).filter(o => !o.minOrderValue || price >= o.minOrderValue);

        let maxD = 0;
        applicable.forEach(o => {
            let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
            if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);
            if (d > maxD) { maxD = d; bestOffer = o; }
        });

        if (bestOffer) finalPrice = Math.round(price - maxD);
    }

    return { product, variants, defaultVariant, bestOffer, finalPrice };
};

export const getEditProductPageDataService = async (id) => {
    const product = await Product.findById(id);
    const categories = await Category.find({ isActive: true });
    const subCategories = await SubCategory.find({ isActive: true });
    return { product, categories, subCategories };
};

export const updateProductService = async (id, data) => {
    const { name, category, subcategory, description, material, careGuide, isActive } = data;

    if (!name || !category || !subcategory) {
        return { success: false, statusCode: 400, message: "Required fields missing" };
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, {
        name, category, subcategory, description, material, careGuide, isActive: isActive === "true" || isActive === true
    }, { new: true });

    if (!updatedProduct) return { success: false, statusCode: 404, message: "Product not found" };

    return { success: true, statusCode: 200, message: "Product updated successfully" };
};

export const deleteProductService = async (id) => {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return { success: false, statusCode: 404, message: "Product not found" };
    return { success: true, statusCode: 200, message: "Product deleted successfully" };
};

export const toggleProductService = async (id) => {
    const product = await Product.findById(id);
    if (!product) return { success: false, message: "Product not found" };
    product.isActive = !product.isActive;
    await product.save();
    return { success: true, isActive: product.isActive, message: `Product ${product.isActive ? "activated" : "deactivated"} successfully` };
};
