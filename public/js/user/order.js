let currentCancelTarget = null; // { type: 'item'|'order', orderId, itemId, itemIds }
let selectedReason = '';

function selectReason(btn) {
    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedReason = btn.innerText;
}

function openCancelModal(target) {
    currentCancelTarget = target;
    selectedReason = '';
    document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('cancelNote').value = '';
    
    const targetName = document.getElementById('cancelTargetName');
    if (target.type === 'item') {
        targetName.innerText = 'this item';
    } else {
        targetName.innerText = 'the entire order';
    }
    
    document.getElementById('cancelModal').classList.add('active');
}

function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('active');
    currentCancelTarget = null;
}

// Attach event listener to confirm button
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmCancelBtn');
    if (confirmBtn) {
        confirmBtn.onclick = handleModalConfirm;
    }
});

async function handleModalConfirm() {
    if (!selectedReason) {
        ajaxToast("warning", "Please select a reason for cancellation");
        return;
    }

    const note = document.getElementById('cancelNote').value;
    const { type, orderId, itemId, itemIds } = currentCancelTarget;
    const btn = document.getElementById('confirmCancelBtn');

    try {
        btn.disabled = true;
        btn.innerHTML = 'Processing...';

        if (type === 'item') {
            const response = await axios.patch(`/orders/${orderId}/items/${itemId}/cancel`, {
                reason: selectedReason,
                note: note
            });

            if (response.data.success) {
                ajaxToast("success", "Item cancelled successfully");
                closeCancelModal();
                setTimeout(() => window.location.reload(), 1500);
            } else {
                throw new Error(response.data.message || "Failed to cancel");
            }
        } else {
            
            ajaxToast("info", "Processing entire order cancellation...");
            for (const id of itemIds) {
                await axios.patch(`/orders/${orderId}/items/${id}/cancel`, {
                    reason: selectedReason,
                    note: note
                });
            }
            ajaxToast("success", "Order cancelled successfully");
            closeCancelModal();
            setTimeout(() => window.location.reload(), 1500);
        }
    } catch (err) {
        ajaxToast("error", err.response?.data?.message || err.message || "Operation failed");
        btn.disabled = false;
        btn.innerHTML = 'Confirm';
    }
}

async function cancelItem(orderId, itemId) {
    const btn = document.getElementById(`btn-cancel-${itemId}`);
    if (btn && (btn.disabled || btn.getAttribute('data-processing') === 'true')) return;
    
    openCancelModal({ type: 'item', orderId, itemId });
}

async function cancelAllItems(orderId, itemIds, btnElement) {
    if (!itemIds || itemIds.length === 0) return;
    
    const btn = btnElement || event?.currentTarget;
    if (btn && (btn.disabled || btn.getAttribute('data-processing') === 'true')) return;

    openCancelModal({ type: 'order', orderId, itemIds });
}

