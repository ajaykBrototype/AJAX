import SubCategory from "../../models/admin/subCategoryModel.js";

export const createSubCategoryService = async (data) => {
  let { name, categoryId, isActive } = data;

  name=name.trim().toLowerCase();

  if (!categoryId) {
  return {
    success: false,
    message: "Category is required"
  };
}

  const existing = await SubCategory.findOne({
    name:{$regex:`^${name}$`,$options:"i"},
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

export const updateSubCategoryService = async (id, data) => {
  let { name, categoryId, isActive } = data;

  name=name.trim().toLowerCase();

  const existing = await SubCategory.findOne({
    name:{$regex:`^${name}$`,$options:"i"},
    category: categoryId,
    _id: { $ne: id }
  });

  if (existing) {
    return {
      success: false,
      message: "SubCategory already exists"
    };
  }

  const subCategory = await SubCategory.findByIdAndUpdate(
    id,
    {
      name,
      category: categoryId,
      isActive
    },
    { new: true }
  );

  return { success: true, subCategory };
};


export const deleteSubCategoryService = async (id) => {
  await SubCategory.findByIdAndDelete(id);
  return { success: true };
};

export const toggleSubCategoryService = async (id) => {
  const sub = await SubCategory.findById(id);

  if (!sub) {
    return { success: false, message: "SubCategory not found" };
  }

  sub.isActive = !sub.isActive;
  await sub.save();

  return { success: true, isActive: sub.isActive };
};
