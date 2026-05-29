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

  function showInlineError(element, message) {
      if (!element) return;
      const container = element.parentElement;
      
      const existing = container.querySelector('.inline-error-msg');
      if (existing) existing.remove();
      
      element.classList.add('border-red-500', 'bg-red-50');
      
      const errorEl = document.createElement('p');
      errorEl.className = 'inline-error-msg text-[10px] text-red-500 font-bold tracking-wide mt-1.5 flex items-center gap-1';
      errorEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
      
      container.appendChild(errorEl);

      const clearError = () => {
          errorEl.remove();
          element.classList.remove('border-red-500', 'bg-red-50');
          element.removeEventListener('input', clearError);
          element.removeEventListener('click', clearError);
      };
      element.addEventListener('input', clearError);
      element.addEventListener('click', clearError);
  }

  function validateVariant(form, sizeInput, newFiles = [], existingImages = []) {
    const color = form.querySelector('[name="color"]');
    const sku = form.querySelector('[name="sku"]');
    const stock = form.querySelector('[name="stock"]');
    const price = form.querySelector('[name="price"]');
    const totalImages = newFiles.length + existingImages.length;
    
    document.querySelectorAll('.inline-error-msg').forEach(e => e.remove());
    document.querySelectorAll('.border-red-500').forEach(e => e.classList.remove('border-red-500', 'bg-red-50'));

    let hasError = false;

    if (!color.value.trim()) { showInlineError(color, "Color is required"); hasError = true; }
    
    const sizeContainer = document.querySelector('.size-btn')?.parentElement;
    if (!sizeInput.value) { showInlineError(sizeContainer, "Please select a size"); hasError = true; }
    
    if (!sku.value.trim()) { showInlineError(sku, "SKU is required"); hasError = true; }
    if (stock.value === '' || stock.value < 0) { showInlineError(stock, "Valid stock required"); hasError = true; }
    if (price.value === '' || price.value <= 0) { showInlineError(price, "Valid price required"); hasError = true; }
    
    const imgTrigger = document.getElementById('uploadTrigger');
    if (totalImages < 3) { showInlineError(imgTrigger, "Minimum 3 images required"); hasError = true; }

    return hasError;
  }

  // ✅ ADD VARIANT
  if (saveVariantBtn) {
    saveVariantBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const uploadedFiles = window.uploadedFiles || [];
      const hasError = validateVariant(variantForm, sizeInput, uploadedFiles, []);

      if (hasError) {
        return;
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

      const hasError = validateVariant(variantForm, sizeInput, currentNewFiles, currentExisting);

      if (hasError) {
        return;
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