/**
 * Product Management AJAX Handler
 * AJAX Portal v1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Toggles the active/inactive status of a product
     * @param {string} productId - The MongoDB ID of the product
     * @param {HTMLInputElement} el - The checkbox element
     */
    window.toggleProductStatus = async function(productId, el) {
        try {
            // Using axios (included in products.ejs)
            const response = await axios.patch(`/admin/products/toggle/${productId}`);
            
            if (response.data.success) {
                const isChecked = response.data.isActive;
                
                // Update UI state
                el.checked = isChecked;
                
                // Update the adjacent status pill
                const pill = el.closest('tr').querySelector('.status-pill');
                if (pill) {
                    pill.textContent = isChecked ? 'Active' : 'Inactive';
                    pill.className = `status-pill ${isChecked ? 'status-active' : 'status-inactive'}`;
                }
                
                // Show toast notification
                if (window.ajaxToast) {
                    ajaxToast('success', response.data.message || 'Product status updated.');
                }
            } else {
                // Revert checkbox state if backend failed
                el.checked = !el.checked;
                if (window.ajaxAlert) {
                    ajaxAlert('error', response.data.message || 'Failed to update status.');
                }
            }
        } catch (err) {
            console.error('Toggle Error:', err);
            // Revert checkbox state on error
            el.checked = !el.checked;
            if (window.ajaxAlert) {
                ajaxAlert('error', err.response?.data?.message || 'Network error occurred.');
            }
        }
    };

    // Sidebar logic (replicated from main products.ejs script if needed, 
    // but products.ejs already has inline script for sidebar)
});
