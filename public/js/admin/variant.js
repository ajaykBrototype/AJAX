window.handleStatusToggle = async (id, el) => {
  const newState = el.checked; 

  try {
    el.disabled = true;

    const res = await axios.patch(`/admin/variants/toggle/${id}`, {
      isActive: newState   
    });

    if (!res.data.success) {
      el.checked = !newState; // revert
      return ajaxAlert("error", "Failed to update");
    }

    ajaxToast("success", "Status updated");

  } catch (err) {
    console.error(err);
    el.checked = !newState; // revert on error
    ajaxAlert("error", "Error updating status");
  } finally {
    el.disabled = false;
  }
};

window.handleDelete = async (id) => {
  const result = await ajaxConfirm({
    title: "CONFIRM DELETE",
    text: "This will permanently delete the variant"
  });

  if (!result.isConfirmed) return;

  try {
    const res = await axios.delete(`/admin/variants/delete/${id}`);

    if (res.data.success) {
      ajaxToast("success", "Variant deleted");

      const row = document.querySelector(`[data-id="${id}"]`);

      if (row) {
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 300);
      }

    } else {
      ajaxAlert("error", res.data.message || "Delete failed");
    }

  } catch (err) {
    console.error(err);
    ajaxAlert("error", "Server error");
  }
};

window.handleDefaultToggle = async (id) => {
  try {
    const res = await axios.patch(`/admin/variants/default/${id}`);
    if (res.data.success) {
      ajaxToast("success", "Default variant updated");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      ajaxAlert("error", res.data.message || "Failed to update default");
    }
  } catch (err) {
    console.error(err);
    ajaxAlert("error", "Server error");
  }
};
document.addEventListener("DOMContentLoaded", () => {

  const variantForm = document.getElementById("variantForm");
  const sizeInput = document.getElementById("sizeInput");
  const saveVariantBtn = document.getElementById("saveVariantBtn");
  const updateVariantBtn = document.getElementById("updateVariantBtn");

  function validateVariant(form, sizeInput, newFiles = [], existingImages = []) {
    const color = form.querySelector('[name="color"]').value.trim();
    const sku = form.querySelector('[name="sku"]').value.trim();
    const stock = form.querySelector('[name="stock"]').value;
    const price = form.querySelector('[name="price"]').value;
    const totalImages = newFiles.length + existingImages.length;

    if (!color) return "Color is required";
    if (!sizeInput.value) return "Please select a size";
    if (!sku) return "SKU is required";
    if (stock === '' || stock < 0) return "Valid stock required";
    if (price === '' || price <= 0) return "Valid price required";
    if (totalImages < 3) return "Minimum 3 images required";

    return null; // No errors
  }

  // ✅ ADD VARIANT
  if (saveVariantBtn) {
    saveVariantBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const uploadedFiles = window.uploadedFiles || [];
      const error = validateVariant(variantForm, sizeInput, uploadedFiles, []);

      if (error) {
        return ajaxToast("error", error, "VALIDATION ERROR");
      }

      // Submit using Axios
      const formData = new FormData(variantForm);
      formData.delete("images");

      uploadedFiles.forEach((blob, i) => {
        formData.append("images", blob, `variant_${i}.jpg`);
      });

      try {
        saveVariantBtn.disabled = true;

        const res = await axios.post(variantForm.action, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res.data.success) {
          ajaxToast("success", "Variant added");
          setTimeout(()=>{
              window.location.href = res.data.redirectUrl;
          },2000)
        } else {
            ajaxToast("error", res.data.message);
        }
      } catch (err) {
          ajaxToast("error", err.response?.data?.message || "Server error");
      } finally {
        saveVariantBtn.disabled = false;
      }
    });
  }

  // ✅ EDIT VARIANT
  if (updateVariantBtn) {
    updateVariantBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const currentNewFiles = window.newFiles || [];
      const currentExisting = window.existingImages || [];

      const error = validateVariant(variantForm, sizeInput, currentNewFiles, currentExisting);

      if (error) {
        return ajaxToast("error", error, "VALIDATION ERROR");
      }

      const formData = new FormData(variantForm);
      formData.append("existingImages", JSON.stringify(currentExisting || []));

      currentNewFiles.forEach((blob, i) => {
        formData.append("images", blob, `variant_${i}.jpg`);
      });

      try {
        updateVariantBtn.disabled = true;

        const res = await axios.post(variantForm.action, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res.data.success) {
          ajaxToast("success", "Variant updated");
           setTimeout(()=>{
             window.location.href = res.data.redirectUrl;
           },2000)
        } else {
          ajaxToast("error", res.data.message);
        }
      } catch (err) {
        ajaxToast("error", err.response?.data?.message || "Server error");
      } finally {
        updateVariantBtn.disabled = false;
      }
    });
  }

  // Dependent Select for Subcategory
  const catSelect = document.querySelector('select[name="category"]');
  const subSelect = document.querySelector('select[name="subcategory"]');

  if (catSelect && subSelect) {
    catSelect.addEventListener('change', async (e) => {
      const catId = e.target.value;

      if (!catId) {
        subSelect.innerHTML = '<option value="">Select category first</option>';
        subSelect.disabled = true;
        return;
      }

      subSelect.disabled = true;
      subSelect.innerHTML = '<option value="">Loading...</option>';

      try {
        const response = await fetch(`/admin/subcategories/by-category/${catId}`);
        const data = await response.json();

        if (data.success && data.subcategories) {
          subSelect.disabled = false;
          subSelect.innerHTML = '<option value="">Select subcategory</option>';
          
          data.subcategories.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub._id;
            opt.textContent = sub.name;
            subSelect.appendChild(opt);
          });
        } else {
          subSelect.innerHTML = '<option value="">No subcategories found</option>';
        }
      } catch (err) {
        console.error('Fetch Error:', err);
        ajaxToast("error", "Failed to load subcategories");
      }
    });
  }
});




const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");


if (searchInput) {
  let timer;

  searchInput.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      const url = new URL(window.location.href);

      url.searchParams.set("search", searchInput.value.trim());

      if (statusFilter) {
        url.searchParams.set("status", statusFilter.value);
      }

      window.location.href = url.toString();
    }, 500);
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    const url = new URL(window.location.href);

    url.searchParams.set("status", statusFilter.value);

    if (searchInput) {
      url.searchParams.set("search", searchInput.value.trim());
    }

    window.location.href = url.toString();
  });
}