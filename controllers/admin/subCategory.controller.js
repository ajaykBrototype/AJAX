import * as subService from "../../services/admin/subCategory.service.js";

export const loadSubCategoryPage = async (req, res) => {
  try {
      const search = req.query.search || "";
      const selectedCategory = req.query.category || ""; 
      const page = parseInt(req.query.page) || 1;
      const limit = 5;

      const data = await subService.getSubCategoryPageDataService(search, selectedCategory, page, limit);

      res.render("admin/subcategories", data);
  } catch (err) {
    console.error("SubCategory Controller Error:", err);
    res.render("admin/subcategories", {
      categories: [], subCategories: [], search: "", currentPage: 1, totalPages: 0, total: 0, selectedCategory: "", totalSubCategory: 0, activeCount: 0, inactiveCount: 0
    });
  }
};

export const createSubCategory = async (req, res) => {
  const result = await subService.createSubCategoryService(req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
};

export const updateSubCategory = async (req, res) => {
  const result = await subService.updateSubCategoryService(req.params.id, req.body);
  if (!result.success) return res.status(400).json(result);
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

export const getSubCategoriesByCategory = async (req, res) => {
  try {
    const result = await subService.getSubCategoriesByCategoryService(req.params.catId);
    res.json(result);
  } catch (err) {
    console.error("Error fetching subcategories by category:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};