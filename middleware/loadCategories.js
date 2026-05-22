
import Category from "../models/admin/categoryModel.js";

export const loadCategories = async (req, res, next) => {

  res.locals.user = req.session.userId || null;

  res.locals.categories = [];

  try {

    const allCategories = await Category.find({
      isActive: true
    });

    res.locals.categories = allCategories;

  } catch (err) {

    console.error("Locals Category Fetch Error:", err);
  }

  next();
};