import Coupon from "../../models/admin/couponModel.js";

export const getCouponPageDataService = async (search, status, sort, page, limit) => {
    const skip = (page - 1) * limit;

    const filter = {
        code: { $regex: search, $options: "i" }
    };

    if (status) {
        filter.status = status;
    }

    let sortQuery = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "discount-high") sortQuery = { discountAmount: -1 };
    if (sort === "discount-low") sortQuery = { discountAmount: 1 };

    const coupons = await Coupon.find(filter).sort(sortQuery).skip(skip).limit(limit);
    const totalCoupons = await Coupon.countDocuments(filter);
    const totalPage = Math.ceil(totalCoupons / limit);

    return {
        coupons,
        totalPage,
        currentPage: page,
        search,
        status,
        sort
    };
};

export const createCouponService = async (data) => {
    const { code, discountType, discountAmount, minOrder, maxDiscount, maxUsage, userLimit, startDate, endDate, status } = data;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return { success: false, statusCode: 400, message: "Coupon already exists" };
    }

    if (new Date(endDate) < new Date(startDate)) {
        return { success: false, statusCode: 400, message: "End date must be after start date" };
    }

    if (discountType === "percentage" && discountAmount > 100) {
        return { success: false, statusCode: 400, message: "Percentage cannot exceed 100" };
    }

    const newCoupon = new Coupon({
        code: code.toUpperCase(),
        discountType,
        discountAmount,
        minOrder,
        maxDiscount,
        maxUsage,
        userLimit,
        startDate,
        endDate,
        status: status || "active"
    });

    await newCoupon.save();
    return { success: true, statusCode: 201, message: "Coupon created successfully" };
};

export const toggleCouponStatusService = async (id) => {
    const coupon = await Coupon.findById(id);
    if (!coupon) return { success: false, statusCode: 404 };
    
    coupon.status = coupon.status === "active" ? "inactive" : "active";
    await coupon.save();
    return { success: true, status: coupon.status };
};

export const updateCouponService = async (id, data) => {
    const { code, discountType, discountAmount, minOrder, maxDiscount, maxUsage, userLimit, startDate, endDate, status } = data;

    const existingCoupon = await Coupon.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id }
    });

    if (existingCoupon) {
        return { success: false, statusCode: 400, message: "Coupon code already exists" };
    }

    await Coupon.findByIdAndUpdate(id, {
        code, discountType, discountAmount, minOrder, maxDiscount, maxUsage, userLimit, startDate, endDate, status
    });

    return { success: true };
};

export const deleteCouponService = async (id) => {
    await Coupon.findByIdAndDelete(id);
    return { success: true, message: "Coupon deleted successfully" };
};

export const getSingleCouponService = async (id) => {
    const coupon = await Coupon.findById(id);
    return { success: true, coupon };
};
