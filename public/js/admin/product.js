

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
            
            // Variant fields
            const color = productForm.querySelector('[name="color"]');
            const sku = productForm.querySelector('[name="sku"]');
            const price = productForm.querySelector('[name="price"]');
            const stock = productForm.querySelector('[name="stock"]');
            const size = document.getElementById('sizeInput');

            let error = "";

            if (!name.value.trim()) error = "Product name is required";
            else if (!category.value) error = "Please select a category";
            else if (!subcategory.value) error = "Please select a subcategory";
            else if (description.value.trim().length < 20) error = "Description must be at least 20 characters";
            else if (!material.value.trim()) error = "Material composition is required";
            else if (!careGuide.value.trim()) error = "Care guidelines are required";
            else if (!color.value.trim()) error = "Primary color is required";
            else if (!sku.value.trim()) error = "SKU is required";
            else if (!price.value || price.value <= 0) error = "Valid price is required";
            else if (stock.value === "" || stock.value < 0) error = "Valid stock is required";
            else if (!size.value) error = "Please select a size";
            else if ((window.uploadedFiles || []).length < 3) error = "Minimum 3 images are required";

            if (error) {
                ajaxToast("error", error);
                return;
            }

            // Submit using FormData
            const formData = new FormData(productForm);
            
            // Enable subcategory if disabled so it gets included
            if (subcategory.disabled) subcategory.disabled = false;

            // Add images from memory
            const uploadedFiles = window.uploadedFiles || [];
            uploadedFiles.forEach((blob, i) => {
                formData.append('images', blob, `product_${i}.jpg`);
            });

            try {
                const submitBtn = productForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                const res = await axios.post(productForm.action, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.data.success) {
                    window.location.href = "/admin/products?created=true";
                } else {
                    ajaxToast("error", res.data.message || "Failed to create product");
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

    // 🔍 SEARCH DEBOUNCE
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