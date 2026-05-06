async function cancelItem(orderId, itemId) {

    const confirmCancel = await ajaxConfirm(
        "Are you sure you want to cancel this item?"
    );

    if (!confirmCancel) return;

    try {

        const response = await axios.patch(
            `/orders/${orderId}/items/${itemId}/cancel`
        );

        if (response.data.success) {

            ajaxToast(
                "success",
                "Item cancelled successfully"
            );

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        }

    } catch (err) {

        ajaxToast(
            "error",
            err.response?.data?.message ||
            "Failed to cancel item"
        );

    }

}