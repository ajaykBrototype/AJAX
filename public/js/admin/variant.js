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