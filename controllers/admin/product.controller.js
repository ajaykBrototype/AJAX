import * as productService from "../../services/admin/product.service.js";

export const toggleProduct = async (req, res) => {
  try {
    const result = await productService.toggleProductService(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error during toggle" });
  }
};

export const loadProductPage = async (req, res) => {
  try {
    const { search, category, subcategory, status, page: pageQuery } = req.query;
    const page = parseInt(pageQuery) || 1;
    const limit = 5;

    const data = await productService.getProductPageDataService(search, category, subcategory, status, page, limit);

    res.render("admin/products", data);
  } catch (err) {
    console.error("Error loading product page:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const loadAddProductPage = async (req, res) => {
  try {
    const data = await productService.getAddProductPageDataService();
    res.render("admin/addProduct", data);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};

export const addProduct = async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    
    const result = await productService.createProductWithVariantService(req.body, images);
    if (!result.success) return res.status(result.statusCode).json(result);
    res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Something went wrong" });
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const data = await productService.getProductDetailsService(req.params.id, req.query.variant);
    
    if (!data) {
      return res.redirect("/admin/products");
    }

    res.render("admin/productDetails", data);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
}

export const loadEditProductPage = async (req, res) => {
  try {
    const data = await productService.getEditProductPageDataService(req.params.id);
    res.render("admin/editProduct", data);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
}

export const updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProductService(req.params.id, req.body);
    if (!result.success) return res.status(result.statusCode).json(result);
    res.json(result);
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProductService(req.params.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    res.json(result);
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};