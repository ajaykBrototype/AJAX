import SubCategory from "../../models/admin/subCategoryModel.js";

export const createSubCategoryService = async (data) => {
  const { name, categoryId, isActive } = data;

  if (!categoryId) {
  return {
    success: false,
    message: "Category is required"
  };
}

  const existing = await SubCategory.findOne({
    name,
    category: categoryId
  });

  if (existing) {
    return {
      success: false,
      message: "SubCategory already exists"
    };
  }

  const subCategory = await SubCategory.create({
    name,
    category: categoryId,
    isActive
  });

  return {
    success: true,
    subCategory
  };
};