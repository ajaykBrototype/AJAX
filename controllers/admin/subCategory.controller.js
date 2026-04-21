import * as subService from "../../services/admin/subCategory.service.js";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";

export const loadSubCategoryPage = async (req, res) => {
  try {
      const search=req.query.search || "";
      const selectedCategory= req.query.category || "" ; 
      const page=parseInt(req.query.page) || 1;
      const limit=5;
      const skip=(page-1)*limit;

      let filter={};
      if(search){
        filter.name={$regex:search,$options:"i"};
      }

      if (selectedCategory) {
       filter.category = selectedCategory;
       }

      const total=await SubCategory.countDocuments(filter);

    const categories = await Category.find({ isActive: true });
           
      const subCategories = await SubCategory.find(filter)
      .populate("category", "name").sort({createdAt:-1}).skip(skip).limit(limit);

      const activeCount=subCategories.filter(cat=>cat.isActive).length;
      const inactiveCount=subCategories.filter(cat=>!cat.isActive).length;

      const totalPages=Math.ceil(total/limit);

    console.log("CATEGORIES:", categories);

    res.render("admin/subcategories", {
      categories,
      subCategories,
      search,
      currentPage: page,
      totalPages,
      total,
      selectedCategory,
      totalSubCategory:subCategories.length,
      activeCount,inactiveCount
    });

  } catch (err) {
    console.log(err);
    res.render("admin/subcategories", {
      categories: [],
       subCategories: [],
       search: "",
       categoryFilter: ""
    });
  }
};

export const createSubCategory=async(req,res)=>{
  const result= await subService.createSubCategoryService(req.body);

  if(!result.success){
    return res.status(400).json(result);
  }
  res.json(result);
}

export const updateSubCategory = async (req, res) => {
  const result = await subService.updateSubCategoryService(
    req.params.id,
    req.body
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

export const deleteSubCategory = async (req, res) => {
  const result = await subService.deleteSubCategoryService(req.params.id);
  res.json(result);
};

export const toggleSubCategory = async (req, res) => {
  const result = await subService.toggleSubCategoryService(req.params.id);
  res.json(result);
};