import Category from "../../models/admin/categoryModel.js";
import * as categoryService from "../../services/admin/category.service.js";

export const loadCategoryPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const data = await categoryService.getCategoryPageDataService(search, page, limit);

    res.render("admin/categories", data);

  } catch (err) {
    console.error("Category Controller Error:", err);
    res.render("admin/categories", {
      categories: [],
      totalCategories: 0,
      totalSubCategories: 0,
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