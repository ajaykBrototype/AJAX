

document.addEventListener("DOMContentLoaded", () => {
   
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("updated") === "true") {
        ajaxToast("success", "Product updated successfully");
    } else if (params.get("created") === "true") {
        ajaxToast("success", "Product created successfully");
    }

    const productForm = document.getElementById("productForm");

    if (productForm) {
        productForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const name = productForm.querySelector('[name="name"]');
            const category = productForm.querySelector('[name="category"]');
            const subcategory = productForm.querySelector('[name="subcategory"]');
            const description = productForm.querySelector('[name="description"]');
            const material = productForm.querySelector('[name="material"]');
            const careGuide = productForm.querySelector('[name="careGuide"]');
            
            // Variant fields (may not exist on edit page)
            const color = productForm.querySelector('[name="color"]');
            const sku = productForm.querySelector('[name="sku"]');
            const price = productForm.querySelector('[name="price"]');
            const stock = productForm.querySelector('[name="stock"]');
            const size = document.getElementById('sizeInput');

            // Generic inline error handler
            function showInlineError(element, message) {
                if (!element) return;
                const container = element.parentElement;
                
                // Remove existing if any
                const existing = container.querySelector('.inline-error-msg');
                if (existing) existing.remove();
                
                element.classList.add('border-red-500', 'bg-red-50');
                
                const errorEl = document.createElement('p');
                errorEl.className = 'inline-error-msg text-[10px] text-red-500 font-bold tracking-wide mt-1.5 flex items-center gap-1';
                errorEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
                
                container.appendChild(errorEl);

                // Auto-clear
                const clearError = () => {
                    errorEl.remove();
                    element.classList.remove('border-red-500', 'bg-red-50');
                    element.removeEventListener('input', clearError);
                    element.removeEventListener('click', clearError);
                };
                element.addEventListener('input', clearError);
                element.addEventListener('click', clearError);
            }

            // Clear previous errors
            document.querySelectorAll('.inline-error-msg').forEach(e => e.remove());
            document.querySelectorAll('.border-red-500').forEach(e => e.classList.remove('border-red-500', 'bg-red-50'));

            let hasError = false;

            const categoryTrigger = document.querySelector('#categoryDropdown .admin-dropdown-trigger');
            const subcategoryTrigger = document.querySelector('#subcategoryDropdown .admin-dropdown-trigger');
            const sizeContainer = document.querySelector('.size-btn')?.parentElement;
            const imgTrigger = document.getElementById('uploadTrigger');

            if (!name.value.trim()) { showInlineError(name, "Product name is required"); hasError = true; }
            if (!category.value) { showInlineError(categoryTrigger, "Please select a category"); hasError = true; }
            if (!subcategory.value) { showInlineError(subcategoryTrigger, "Please select a subcategory"); hasError = true; }
            if (description.value.trim().length < 20) { showInlineError(description, "Description must be at least 20 characters"); hasError = true; }
            if (!material.value.trim()) { showInlineError(material, "Material composition is required"); hasError = true; }
            if (!careGuide.value.trim()) { showInlineError(careGuide, "Care guidelines are required"); hasError = true; }
            
            if (color) {
                if (!color.value.trim()) { showInlineError(color, "Primary color is required"); hasError = true; }
                if (!sku.value.trim()) { showInlineError(sku, "SKU is required"); hasError = true; }
                if (!price.value || price.value <= 0) { showInlineError(price, "Valid price is required"); hasError = true; }
                if (stock.value === "" || stock.value < 0) { showInlineError(stock, "Valid stock is required"); hasError = true; }
                if (!size || !size.value) { showInlineError(sizeContainer, "Please select a size"); hasError = true; }
                if ((window.uploadedFiles || []).length < 3) { showInlineError(imgTrigger, "Minimum 3 images are required"); hasError = true; }
            }

            if (hasError) return;

            try {
                const submitBtn = productForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                const isEdit = productForm.action.includes('edit');
                let res;

                if (isEdit) {
                    
                    const data = {
                        name: name.value.trim(),
                        category: category.value,
                        subcategory: subcategory.value,
                        description: description.value.trim(),
                        material: material.value.trim(),
                        careGuide: careGuide.value.trim(),
                        isActive: productForm.querySelector('[name="isActive"]').checked
                    };
                    res = await axios.post(productForm.action, data);
                } else {
                    // Send as FormData for add page (images included)
                    const formData = new FormData(productForm);
                    if (subcategory.disabled) subcategory.disabled = false;
                    const uploadedFiles = window.uploadedFiles || [];
                    uploadedFiles.forEach((blob, i) => {
                        formData.append('images', blob, `product_${i}.jpg`);
                    });
                    res = await axios.post(productForm.action, formData);
                }

                if (res.data.success) {
                    window.location.href = `/admin/products?${isEdit ? 'updated' : 'created'}=true`;
                } else {
                    ajaxToast("error", res.data.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
                }
            } catch (err) {
                console.error(err);
                ajaxToast("error", err.response?.data?.message || "Server error occurred");
            } finally {
                const submitBtn = productForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

  
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


    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                searchInput.form.submit();
            }, 500);
        });
    }
});

async function toggleProductStatus(productId, toggleInput) {
    const originalState = !toggleInput.checked; // To revert if it fails
    const newStatus = toggleInput.checked;

    try {
        const response = await axios.patch(`/admin/products/toggle/${productId}`);

        if (response.data.success) {
          
            const pill = toggleInput.closest('td').querySelector('.status-pill');
            if (pill) {
                pill.textContent = newStatus ? 'Active' : 'Inactive';
                pill.className = `status-pill ${newStatus ? 'status-active' : 'status-inactive'}`;
            }
            ajaxToast('success', `Product is now ${newStatus ? 'Active' : 'Inactive'}`);
        } else {
            throw new Error();
        }
    } catch (error) {
        toggleInput.checked = originalState;
        ajaxToast('error', 'Failed to update product status');
    }
}


async function deleteProduct(productId) {
    const result = await ajaxConfirm({
        title: 'DELETE PRODUCT?',
        text: 'This will permanently remove this piece and all its associated variants from the catalog.',
        confirmText: 'DELETE',
        cancelText: 'CANCEL',
        icon: 'warning'
    });

    if (result.isConfirmed) {
        try {
            const response = await axios.delete(`/admin/products/delete/${productId}`);
            
            if (response.data.success) {
                ajaxToast('success', 'Product deleted successfully');
                // Reload after a short delay or remove row from DOM
                setTimeout(() => window.location.reload(), 1000);
            } else {
                ajaxToast('error', response.data.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error(error);
            ajaxToast('error', 'Something went wrong while deleting');
        }
    }
}