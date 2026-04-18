import { success } from "zod";
import Category from "../../models/admin/categoryModel.js";

export const createCategoryService=async(data)=>{
   const {name,isActive}=data;
   
   const existing=await Category.findOne({name});

   if(existing){
    return {
        success:false,
        message:"Category already exists"
    };
    }
    const category=await Category.create({name,isActive});
    return{
        success:true,
        category
    };
}

export const getCategoriesService=async()=>{
    const categories=await Category.find().sort({createdAt:-1});
    return {success:true,categories};
}

export const updateCategoryService=async(id,data)=>{
  const {name,isActive}=data;

  const existing=await Category.findOne({
    name,
    _id:{$ne:id}
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