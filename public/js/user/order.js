async function cancelItem(orderId, itemId) {
    const btn = document.getElementById(`btn-cancel-${itemId}`);
    
    
    if (btn && (btn.disabled || btn.getAttribute('data-processing') === 'true')) return;

    const result = await ajaxConfirm({
        text: "Are you sure you want to cancel this item?"
    });

    if (!result.isConfirmed) return;

    try {
        if (btn) {
            btn.disabled = true;
            btn.setAttribute('data-processing', 'true');
            btn.innerHTML = 'Cancelling...';
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        const response = await axios.patch(
            `/orders/${orderId}/items/${itemId}/cancel`
        );

        if (response.data.success) {
            ajaxToast("success", "Item cancelled successfully");
            
           
            if (btn) {
                btn.innerHTML = 'Cancelled';
                btn.classList.remove('text-red-400', 'hover:text-red-600', 'hover:bg-red-50');
                btn.classList.add('text-red-500', 'bg-red-50', 'opacity-60');
            }

            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error(response.data.message || "Failed to cancel");
        }

    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.setAttribute('data-processing', 'false');
            btn.innerHTML = 'Cancel Item';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        ajaxToast("error", err.response?.data?.message || err.message || "Failed to cancel item");
    }
}

async function cancelAllItems(orderId, itemIds, btnElement) {
    if (!itemIds || itemIds.length === 0) return;
    
    const btn = btnElement || event?.currentTarget;
    if (btn && (btn.disabled || btn.getAttribute('data-processing') === 'true')) return;

    const result = await ajaxConfirm({
        text: "Are you sure you want to cancel the entire order?"
    });

    if (!result.isConfirmed) return;

    try {
        if (btn) {
            btn.disabled = true;
            btn.setAttribute('data-processing', 'true');
            btn.innerHTML = 'Processing Cancellation...';
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        ajaxToast("info", "Processing cancellation...");
        
        for (const itemId of itemIds) {
            await axios.patch(`/orders/${orderId}/items/${itemId}/cancel`);
        }

        ajaxToast("success", "Order cancelled successfully");
        
        if (btn) {
            btn.innerHTML = 'Cancelled';
        }

        setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.setAttribute('data-processing', 'false');
            btn.innerHTML = 'Cancel Entire Order';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        ajaxToast("error", "An error occurred during order cancellation.");
        setTimeout(() => window.location.reload(), 2000);
    }
}

async function returnItem(orderId, itemId) {
    const result = await ajaxConfirm({
        text: "Are you sure you want to return this item?"
    });

    if (result.isConfirmed) {
        ajaxToast("success", "Return request initiated. Our team will contact you soon.");
    }
}

async function returnAllItems(orderId) {
    const result = await ajaxConfirm({
        text: "Are you sure you want to return the entire order?"
    });

    if (result.isConfirmed) {
        ajaxToast("success", "Order return request initiated. Our team will contact you soon.");
    }
}