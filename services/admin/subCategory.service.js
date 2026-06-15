import SubCategory from "../../models/admin/subCategoryModel.js";
import Category from "../../models/admin/categoryModel.js";

export const getSubCategoryPageDataService = async (search, selectedCategory, page, limit) => {
    const skip = (page - 1) * limit;
    let filter = {};

    if (search) {
        filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (selectedCategory && selectedCategory !== "all") {
        filter.category = selectedCategory;
    }

    const total = await SubCategory.countDocuments(filter);

    const subCategories = await SubCategory.find(filter)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const categories = await Category.find({ isActive: true });

    const activeCount = await SubCategory.countDocuments({ ...filter, isActive: true });
    const inactiveCount = await SubCategory.countDocuments({ ...filter, isActive: false });
    const totalPages = Math.ceil(total / limit);

    return {
        categories,
        subCategories,
        search,
        currentPage: page,
        totalPages,
        total,
        selectedCategory,
        totalSubCategory: total,
        activeCount,
        inactiveCount
    };
};

export const createSubCategoryService = async (data) => {
    let { name, categoryId, isActive } = data;
    name = name.trim();

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
        return {
            success: false,
            message: "Subcategory name must contain only letters and single spaces"
        };
    }

    if (!categoryId) return { success: false, message: "Category is required" };

    const existing = await SubCategory.findOne({ name: { $regex: `^${name}$`, $options: "i" }, category: categoryId });
    if (existing) return { success: false, message: "SubCategory already exists" };

    const subCategory = await SubCategory.create({ name, category: categoryId, isActive });
    return { success: true, subCategory };
};

export const updateSubCategoryService = async (id, data) => {
    let { name, categoryId, isActive } = data;
    name = name.trim();
    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
        return {
            success: false,
            message: "Subcategory name must contain only letters and single spaces"
        };
    }

    const existing = await SubCategory.findOne({ name: { $regex: `^${name}$`, $options: "i" }, category: categoryId, _id: { $ne: id } });
    if (existing) return { success: false, message: "SubCategory already exists" };

    const subCategory = await SubCategory.findByIdAndUpdate(id, { name, category: categoryId, isActive }, { new: true });
    return { success: true, subCategory };
};


export const deleteSubCategoryService = async (id) => {
    await SubCategory.findByIdAndDelete(id);
    return { success: true };
};

export const toggleSubCategoryService = async (id) => {
    const sub = await SubCategory.findById(id);
    if (!sub) return { success: false, message: "SubCategory not found" };

    sub.isActive = !sub.isActive;
    await sub.save();
    return { success: true, isActive: sub.isActive };
};

export const getSubCategoriesByCategoryService = async (catId) => {
    const subcategories = await SubCategory.find({ category: catId, isActive: true });
    return { success: true, subcategories };
};
