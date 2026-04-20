import * as subService from "../../services/admin/subCategory.service.js";
import Category from "../../models/admin/categoryModel.js";
import SubCategory from "../../models/admin/subCategoryModel.js";

export const loadSubCategoryPage = async (req, res) => {
  try {
      const search=req.query.search || "";
      const categoryFilter=req.query.category || "";

      let filter={};

      if(search){
        filter.name={$regex:search,$options:"i"};
      }

    const categories = await Category.find({ isActive: true });
           
      const subCategories = await SubCategory.find()
      .populate("category", "name").sort({createdAt:-1});

    console.log("CATEGORIES:", categories);

    res.render("admin/subcategories", {
      categories,
      subCategories,
      search,
      categoryFilter
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