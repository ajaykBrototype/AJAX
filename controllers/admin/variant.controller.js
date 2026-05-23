import * as variantService from "../../services/admin/variant.service.js";

export const loadVariantPage = async (req, res) => {
  try {
    const data = await variantService.getVariantPageDataService(req.params.id, req.query.search, req.query.status);
    res.render("admin/variants", data);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};

export const loadAddVariantPage = async (req, res) => {
  try {
    const data = await variantService.getAddVariantPageDataService(req.params.id);
    if (!data) return res.redirect("/admin/products");

    res.render("admin/addVariant", data);
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};

export const addVariant = async (req, res) => {
  try {
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.path.replace(/\\/g, "/").replace("public", ""));
    }

    const result = await variantService.addVariantService(req.body, imagePaths);
    if (!result.success) return res.status(result.statusCode).json(result);
    res.json(result);
  } catch (err) {
    console.error("Error adding variant:", err);
    res.status(500).json({ success: false, message: err.message || "Error adding variant" });
  }
};

export const toggleVariantStatus = async (req, res) => {
  try {
    const result = await variantService.toggleVariantStatusService(req.params.id, req.body.isActive === true);
    res.json(result);
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
};

export const setDefaultVariant = async (req, res) => {
  try {
    const result = await variantService.setDefaultVariantService(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("Error setting default variant:", err);
    res.json({ success: false, message: "Server error" });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const result = await variantService.deleteVariantService(req.params.id);
    if (!result.success) return res.json(result);
    res.status(200).json(result);
  } catch (err) {
    res.json({ success: false });
  }
};

export const loadEditVariantPage = async (req, res) => {
  try {
    const data = await variantService.getEditVariantPageDataService(req.params.id);
    if (!data) return res.redirect("/admin/products");
    res.render("admin/editVariant", data);
  } catch (err) {
     console.log(err);
    res.redirect("/admin/products");
  }
}

export const updateVariant = async (req, res) => {
  try {
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.path.replace(/\\/g, "/").replace("public", ""));
    }

    const result = await variantService.updateVariantService(req.params.id, req.body, newImages);
    if (!result.success && result.statusCode === 400) return res.json(result);
    res.json(result);
  } catch (err) {
    console.error("Update Variant Error:", err);
    res.json({ success: false, message: "Update failed" });
  }
};