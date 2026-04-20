import { success } from "zod";
import Category from "../../models/admin/categoryModel.js";
import * as categoryService from "../../services/admin/category.service.js";

export const loadCategoryPage=async(req,res)=>{
    try{
         const page=parseInt(req.query.page)||1;
         const limit=5;
         const skip=(page-1)*limit;

        const categories=await Category.find().sort({createdAt:-1}).skip(skip).limit(limit);

        
        const activeCount=categories.filter(cat=>cat.isActive).length;
        const inactiveCount=categories.filter(cat=>!cat.isActive).length;
         res.render("admin/categories",{
            categories,
            totalCategories:categories.length,
            activeCount,inactiveCount
         })
    }catch(err){
         console.log(err);
         res.render("admin/categories",{
            categories:[],
            totalCategories:0
         })
    }
}
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