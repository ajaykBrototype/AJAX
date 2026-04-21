import { success } from "zod";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";
import * as categoryService from "../../services/admin/category.service.js";

export const loadCategoryPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    let matchStage = {};

    if (search) {
      matchStage.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.aggregate([
      {
        $match: matchStage   // ✅ search filter
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

    // ✅ total count WITH search
    const total = await Category.countDocuments(matchStage);

    // ✅ total subcategories
    const totalSubCategories = await SubCategory.countDocuments();

    // ✅ status counts
    const activeCount = await Category.countDocuments({ isActive: true });
    const inactiveCount = await Category.countDocuments({ isActive: false });

    const totalPages = Math.ceil(total / limit);

    res.render("admin/categories", {
      categories,
      totalSubCategories,
      search,
      currentPage: page,
      totalCategories: total,
      activeCount,
      inactiveCount,
      totalPages,
      total
    });

  } catch (err) {
    console.log(err);
    res.render("admin/categories", {
      categories: [],
      totalCategories: 0,
      activeCount: 0,
      inactiveCount: 0,
      totalPages: 0,
      total: 0,
      currentPage: 1,
      search: ""
    });
  }
};



export const createCategory=async(req,res)=>{
    const result=await categoryService.createCategoryService(req.body);

    if(!result.success){
        return res.status(400).json({
            success:false,
            message:result.message
        })
    }
    res.json(result);
}
export const getCategories = async (req, res) => {
  const result = await categoryService.getCategoriesService();
  res.json(result);
};

export const updateCategory=async(req,res)=>{
    const result=await categoryService.updateCategoryService(
        req.params.id,
        req.body
    );
    if(!result.success){
        return res.status(400).json(result);
    }
    res.json(result);
}



export const toggleCategory = async (req, res) => {
  const result = await categoryService.toggleCategoryService(req.params.id);
  res.json(result);
};

export const deleteCategory = async (req, res) => {
  const result = await categoryService.deleteCategoryService(req.params.id);
  res.json(result);
};