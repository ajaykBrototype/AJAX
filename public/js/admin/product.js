

document.addEventListener("DOMContentLoaded", () => {
   
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("updated") === "true") {
        ajaxToast("success", "Product updated successfully");
    } else if (params.get("created") === "true") {
        ajaxToast("success", "Product created successfully");
    }

    const productForm = document.getElementById("productForm");

    if (productForm) {
        productForm.addEventListener("submit", function (e) {
            const name = productForm.querySelector('[name="name"]');
            const category = productForm.querySelector('[name="category"]');
            const subcategory = productForm.querySelector('[name="subcategory"]');
            const description = productForm.querySelector('[name="description"]');
            const material = productForm.querySelector('[name="material"]');
            const careGuide = productForm.querySelector('[name="careGuide"]');

            let error = "";

            // Validation Logic
            if (!name.value.trim()) {
                error = "Product name is required";
            } else if (!category.value) {
                error = "Please select a category";
            } else if (!subcategory.value) {
                error = "Please select a subcategory";
            } else if (description.value.trim().length < 20) {
                error = "Description must be at least 20 characters";
            } else if (!material.value.trim()) {
                error = "Material composition is required";
            } else if (!careGuide.value.trim()) {
                error = "Care guidelines are required";
            }

            if (error) {
                e.preventDefault(); // Stop form submission
                ajaxToast("error", error);
                return;
            }

            // SUCCESS PATH:
            // If the subcategory select was disabled (during loading), 
            // we must enable it before submission or the data won't be sent to the server.
            if (subcategory.disabled) {
                subcategory.disabled = false;
            }
            
            // Note: Don't show success toast here because the redirect 
            // will refresh the page and kill the toast immediately.
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