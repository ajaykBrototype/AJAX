import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import Wishlist from "../../models/user/wishlistModel.js";
import Offer from "../../models/admin/offerModel.js";

const getBestOffer = (activeOffers, prod, price) => {
  if (!activeOffers || activeOffers.length === 0) return null;

  const pOffers = activeOffers.filter(o => 
    o.applicableTo === 'product' && o.targetProduct && o.targetProduct.toString() === prod._id.toString()
  );

  const cOffers = activeOffers.filter(o => 
    o.applicableTo === 'category' && o.targetCategory && prod.category && o.targetCategory.toString() === prod.category.toString()
  );

  const applicable = [...pOffers, ...cOffers].filter(o => !o.minOrderValue || price >= o.minOrderValue);
  
  let best = null;
  let maxD = 0;
  applicable.forEach(o => {
    let d = o.discountMode === 'percentage' ? (price * o.discountValue) / 100 : o.discountValue;
    if (o.maxDiscountCap) d = Math.min(d, o.maxDiscountCap);

    if (d > maxD) {
      maxD = d;
      best = o;
    }
  });
  return best;
};

const getCategoryProductsHelper = async (categoryNameRegex, sub, page, userId) => {
    const limit = 8;
    const skip = (page - 1) * limit;

    const targetCategory = await Category.findOne({ name: { $regex: categoryNameRegex, $options: "i" } });
    if (!targetCategory) return { products: [], subCategories: [], selectedSub: null, currentPage: 1, totalPages: 1, totalProducts: 0, targetCategory: null, wishlist: [] };

    const subCategories = await SubCategory.find({ category: targetCategory._id, isActive: true });

    let filter = { isActive: true, category: targetCategory._id };

    if (sub) {
      filter.subcategory = sub;
    } else {
      filter.subcategory = { $in: subCategories.map(s => s._id) };
    }

    const wishlist = userId ? await Wishlist.findOne({ user: userId }) : null;

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filter).skip(skip).limit(limit).lean();

    const today = new Date();
    const activeOffers = await Offer.find({
      isActive: true, startDate: { $lte: today }, endDate: { $gte: today }
    }).lean();

    const productData = await Promise.all(
      products.map(async (prod) => {
        const variants = await Variant.find({ productId: prod._id, isActive: true }).lean();
        const v = variants[0];
        const offer = v ? getBestOffer(activeOffers, prod, v.price) : null;
        let finalPrice = v?.price || null;
        if (offer && v) {
          let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
          if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
          finalPrice = v.price - d;
        }
        return { ...prod, variants, finalPrice, offer };
      })
    );

    return {
        products: productData, subCategories, selectedSub: sub || null, currentPage: Number(page),
        totalPages, totalProducts, targetCategory, wishlist: wishlist?.items.map(i => i.product.toString()) || []
    };
};

export const getMenPageDataService = async (sub, page, userId) => {
    return await getCategoryProductsHelper("^men$", sub, page, userId);
};

export const getWomenPageDataService = async (sub, page, userId) => {
    return await getCategoryProductsHelper("^women$", sub, page, userId);
};

export const getCategoryPageDataService = async (name, sub, page, userId) => {
    return await getCategoryProductsHelper(`^${name}$`, sub, page, userId);
};

export const getProductDetailsService = async (productId, userId) => {
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) return null;

    const category = await Category.findById(product.category).lean(); 
    const subCategory = await SubCategory.findById(product.subcategory).lean();
    const variants = await Variant.find({ productId, isActive: true }).lean();
    const defaultVariant = variants.find(v => v.isDefault) || variants[0];

    const relatedRaw = await Product.find({
        category: product.category, _id: { $ne: product._id }, isActive: true
    }).limit(4).lean();

    const today = new Date();
    const activeOffers = await Offer.find({
        isActive: true, startDate: { $lte: today }, endDate: { $gte: today }
    }).lean();

    const pOffers = activeOffers.filter(o => o.applicableTo === 'product' && o.targetProduct && o.targetProduct.toString() === product._id.toString());
    const cOffers = activeOffers.filter(o => o.applicableTo === 'category' && o.targetCategory && product.category && o.targetCategory.toString() === product.category.toString());
    
    const applicableOffers = [...pOffers, ...cOffers];
    const bestOffer = getBestOffer(activeOffers, product, defaultVariant.price);

    const relatedProducts = await Promise.all(
        relatedRaw.map(async (p) => {
            const v = await Variant.findOne({ productId: p._id, isActive: true }).lean();
            const offer = v ? getBestOffer(activeOffers, p, v.price) : null;
            let finalPrice = v?.price || null;
            if (offer && v) {
                let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
                if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
                finalPrice = v.price - d;
            }
            return { ...p, image: v?.images?.[0] || null, price: v?.price || null, finalPrice, offer };
        })
    );

    const stock = defaultVariant?.stock || 0;
    const wishlistDoc = userId ? await Wishlist.findOne({ user: userId }) : null;
    const wishlist = wishlistDoc?.items.map(i => i.product.toString()) || [];
    const wishlistedVariants = wishlistDoc?.items.map(i => i.variant.toString()) || [];

    return { product, variants, variant: defaultVariant, relatedProducts, category, subCategory, stock, wishlist, wishlistedVariants, bestOffer, applicableOffers };
};

export const checkQuantityService = async (variantId, quantity) => {
    const variant = await Variant.findById(variantId);
    if (!variant) return { success: false, message: "Variant not found" };
    if (quantity > 5) return { success: false, message: "Maximum 5 items allowed" };
    if (quantity > variant.stock) return { success: false, message: `Only ${variant.stock} items available` };
    
    return { success: true };
};

export const getFilteredProductsService = async (query, userId) => {
    const { search, sort, category, minPrice, maxPrice, mainCategory } = query;
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || 1000000;
    const targetCategoryName = mainCategory || 'men';

    const targetCategory = await Category.findOne({ name: { $regex: new RegExp(`^${targetCategoryName}$`, "i") } });
    if (!targetCategory) return { success: true, products: [], wishlist: [] };

    let filter = { isActive: true, category: targetCategory._id };

    if (search) filter.name = { $regex: search, $options: "i" };

    if (category) {
        filter.subcategory = category;
    } else {
        const subs = await SubCategory.find({ category: targetCategory._id, isActive: true });
        filter.subcategory = { $in: subs.map(s => s._id) };
    }

    let products = await Product.find(filter).lean();
    const today = new Date();
    const activeOffers = await Offer.find({ isActive: true, startDate: { $lte: today }, endDate: { $gte: today } }).lean();

    let productData = await Promise.all(
        products.map(async (p) => {
            const variants = await Variant.find({ productId: p._id, isActive: true, price: { $gte: min, $lte: max } }).lean();
            if (!variants.length) return null;

            const v = variants[0];
            const offer = v ? getBestOffer(activeOffers, p, v.price) : null;
            let finalPrice = v?.price || null;
            
            if (offer && v) {
                let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
                if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
                finalPrice = v.price - d;
            }
            return { ...p, variants, finalPrice, offer };
        })
    );

    productData = productData.filter(Boolean);

    const getPrice = (p) => p.variants?.[0]?.price || 0;
    if (sort === "price-low") productData.sort((a, b) => getPrice(a) - getPrice(b));
    if (sort === "price-high") productData.sort((a, b) => getPrice(b) - getPrice(a));
    if (sort === "name-az") productData.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-za") productData.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "newest") productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const wishlistDoc = userId ? await Wishlist.findOne({ user: userId }) : null;
    const wishlist = wishlistDoc?.items.map(i => i.product.toString()) || [];

    return { success: true, products: productData, wishlist };
};

export const searchProductsService = async (queryStr) => {
    const q = (queryStr || '').trim();
    if (!q || q.length < 1) return { success: true, results: [] };

    const subCategoryMatches = await SubCategory.find({ name: { $regex: q, $options: 'i' }, isActive: true }).lean();
    const subIds = subCategoryMatches.map(s => s._id);

    const products = await Product.find({
        isActive: true,
        $or: [ { name: { $regex: q, $options: 'i' } }, { subcategory: { $in: subIds } } ]
    }).populate('subcategory', 'name').limit(8).lean();

    const today = new Date();
    const activeOffers = await Offer.find({ isActive: true, startDate: { $lte: today }, endDate: { $gte: today } }).lean();

    const results = await Promise.all(products.map(async (p) => {
        const v = await Variant.findOne({ productId: p._id, isActive: true }).lean();
        if (!v) return null;

        const offer = getBestOffer(activeOffers, p, v.price);
        let finalPrice = v.price;
        if (offer) {
            let d = offer.discountMode === 'percentage' ? (v.price * offer.discountValue) / 100 : offer.discountValue;
            if (offer.maxDiscountCap) d = Math.min(d, offer.maxDiscountCap);
            finalPrice = v.price - d;
        }

        return {
            _id: p._id, name: p.name, image: v.images?.[0] || null, price: v.price, finalPrice: offer ? Math.round(finalPrice) : null,
            subcategory: p.subcategory?.name || null
        };
    }));

    return { success: true, results: results.filter(Boolean) };
};
