import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";

export const createCategoryService = async (data) => {
  let { name, isActive } = data;

  name = name.trim().toLowerCase();

  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
    return {
      success: false,
      message: "Category name must contain only letters and single spaces"
    };
  }

  const existing = await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" }
  });

  if (existing) {
    return {
      success: false,
      message: "Category already exists"
    };
  }

  const category = await Category.create({ name, isActive });

  return {
    success: true,
    category
  };
};

export const getCategoriesService=async()=>{
    const categories=await Category.find().sort({createdAt:-1});
    return {success:true,categories};
}

export const updateCategoryService=async(id,data)=>{
  let {name,isActive}=data;

  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
    return {
      success: false,
      message: "Category name must contain only letters and single spaces"
    };
  }
     name = name.trim().toLowerCase();

  const existing=await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    _id: { $ne: id }
  });

  if(existing){
    return{
      success:false,
      message:"Category already exists"
    }
  }
  const category=await Category.findByIdAndUpdate(
    id,
    {name,isActive},
    {new:true}
  );
  return {
    success:true,
    category
  }
}

export const toggleCategoryService = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    return { success: false, message: "Category not found" };
  }

  category.isActive = !category.isActive;
  await category.save();

  return { success: true };
};


export const deleteCategoryService = async (id) => {
  await Category.findByIdAndDelete(id);
  return { success: true };
};

export const getCategoryPageDataService = async (search, page, limit) => {
  const skip = (page - 1) * limit;
  let matchStage = {};

  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }

  const categories = await Category.aggregate([
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "category",
        as: "subCategories"
      }
    },
    {
      $addFields: {
        subCount: { $size: "$subCategories" }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  const total = await Category.countDocuments(matchStage);
  const totalSubCategories = await SubCategory.countDocuments();
  const activeCount = await Category.countDocuments({ isActive: true });
  const inactiveCount = await Category.countDocuments({ isActive: false });
  const totalPages = Math.ceil(total / limit);

  return {
    categories,
    totalSubCategories,
    search,
    currentPage: page,
    totalCategories: total,
    activeCount,
    inactiveCount,
    totalPages,
    total
  };
};