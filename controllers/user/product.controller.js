

import * as productService from "../../services/user/product.service.js";

export const loadMenPage = async (req, res) => {
  try {
    const data = await productService.getMenPageDataService(req.query.sub, req.query.page || 1, req.session.userId);
    if (!data.targetCategory) return res.redirect("/home");
    res.render("user/men-product-list", data);
  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};

export const loadCategoryPage = async (req, res) => {
  try {
    const data = await productService.getCategoryPageDataService(req.params.name, req.query.sub, req.query.page || 1, req.session.userId);
    if (!data.targetCategory) return res.redirect("/home");
    res.render("user/categoryProductList", data);
  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};

export const loadWomenPage = async (req, res) => {
  try {
    const data = await productService.getWomenPageDataService(req.query.sub, req.query.page || 1, req.session.userId);
    if (!data.targetCategory) return res.redirect("/home");
    res.render("user/women-product-list", data);
  } catch (err) {
    console.log(err);
    res.redirect("/home");
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const data = await productService.getProductDetailsService(req.params.id, req.session.userId);
    if (!data) return res.redirect("/home");
    res.render("user/productDetails", data);
  } catch (err) {
    console.log("PRODUCT DETAILS ERROR:", err);
    res.redirect("/home");
  }
};

export const checkQuantity = async (req, res) => {
  try {
    const result = await productService.checkQuantityService(req.body.variantId, req.body.quantity);
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: "Server error" });
  }
};

export const loadFilteredProducts = async (req, res) => {
  try {
    const result = await productService.getFilteredProductsService(req.query, req.session.userId);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const result = await productService.searchProductsService(req.query.q);
    res.json(result);
  } catch (err) {
    console.error('SEARCH ERROR:', err);
    res.json({ success: false, results: [] });
  }
};




