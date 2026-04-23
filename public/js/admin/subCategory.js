document.addEventListener('DOMContentLoaded', () => {
    /* UI ELEMENTS */
    const m = document.getElementById('subCategoryModal');
    const mc = document.getElementById('subModalContent');
    const sb = document.getElementById('sidebar');
    const sbToggle = document.getElementById('sidebarToggle');
    const sbOverlay = document.getElementById('sidebarOverlay');

    /* MODAL ACCESSORS (Internal) */
    const showSubModal = () => {
        m.classList.remove('hidden');
        m.classList.add('flex');
        setTimeout(() => {
            mc.classList.remove('scale-95', 'opacity-0');
            mc.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    window.closeSubModal = function () {
        mc.classList.remove('scale-100', 'opacity-100');
        mc.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            m.classList.add('hidden');
            m.classList.remove('flex');
        }, 200);
    };

    /* EXPOSED HELPERS */
    window.openSubModal = function () {
        document.getElementById('subModalTitle').textContent = 'New Sub-tier';
        document.getElementById('subCategoryId').value = '';
        document.getElementById('modalCategory').value = '';
        document.getElementById('subCategoryName').value = '';
        document.getElementById('subCategoryStatus').checked = true;
        document.getElementById('saveBtn').textContent = 'Save Node';
        showSubModal();
    };
  

   window.handleEditClick = function (btn) {
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');
    const catId = btn.getAttribute('data-category');
    const active = btn.getAttribute('data-active') === 'true';

    openSubEditModal(id, name, catId, active);
};

    window.openSubEditModal = function (id, name, catId, status) {
        document.getElementById('subModalTitle').textContent = 'Update Sub-tier';
        document.getElementById('subCategoryId').value = id;
        document.getElementById('modalCategory').value = catId;
        document.getElementById('subCategoryName').value = name;
        document.getElementById('subCategoryStatus').checked = (status === true || status === 'true');
        document.getElementById('saveBtn').textContent = 'Apply Updates';
        showSubModal();
    };

    /* ACTIONS */
    window.saveSubCategory = async function () {
        const id = document.getElementById('subCategoryId').value;
        const name = document.getElementById('subCategoryName').value.trim();
        const categoryId = document.getElementById('modalCategory').value;
        const isActive = document.getElementById('subCategoryStatus').checked;

        if (!categoryId) {
            ajaxToast('warning', 'Please select a parent category.');
            return;
        }

        if (!name) {
            ajaxToast('warning', 'Subcategory name is required.');
            return;
        }

        try {
            let res;
            if (id) {
                res = await axios.patch(`/admin/subcategories/${id}`, { name, categoryId, isActive });
            } else {
                res = await axios.post("/admin/subcategories/add", { name, categoryId, isActive });
            }

            if (res.data.success) {
                window.closeSubModal();
                ajaxToast('success', res.data.message || 'Subcategory saved.');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) {
            ajaxAlert('error', err.response?.data?.message || 'Failed to save subcategory.');
        }
    };

    window.toggleSubCategory = async function (id, el) {
        try {
            const res = await axios.patch(`/admin/subcategories/toggle/${id}`);
            if (res.data.success) {
                const isChecked = el.checked;
                const pill = el.closest("tr").querySelector(".status-pill");
                if (isChecked) {
                    pill.textContent = "LIVE";
                    pill.className = "status-pill status-active";
                    ajaxToast('success', 'Subcategory activated.');
                } else {
                    pill.textContent = "IDLE";
                    pill.className = "status-pill status-inactive";
                    ajaxToast('info', 'Subcategory deactivated.');
                }
            } else {
                el.checked = !el.checked;
                ajaxAlert('error', res.data.message || 'Toggle failed.');
            }
        } catch (err) {
            el.checked = !el.checked;
            ajaxAlert('error', 'Network error during toggle.');
        }
    };

    window.deleteSubCategory = async function (id) {
        const result = await ajaxConfirm({
            title: "DELETE SUBCATEGORY?",
            text: "Products linked to this subcategory will be affected.",
            confirmText: "DELETE",
            cancelText: "CANCEL",
            icon: "warning"
        });

        if (!result.isConfirmed) return;

        try {
            const res = await axios.delete(`/admin/subcategories/${id}`);
            if (res.data.success) {
                ajaxToast('success', 'Subcategory removed.');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) {
            ajaxAlert('error', 'Delete operation failed.');
        }
    };

    /* SIDEBAR & OVERLAY */
    sbToggle?.addEventListener('click', () => {
        sb.classList.toggle('open');
        sbOverlay.classList.toggle('hidden');
    });

    sbOverlay?.addEventListener('click', () => {
        sb.classList.remove('open');
        sbOverlay.classList.add('hidden');
    });

    /* LOGOUT */
    document.getElementById('logoutBTN')?.addEventListener('click', () => {
        ajaxConfirm({
            title: "SIGN OUT?",
            text: "Ending your administrator session in AJAX.",
            confirmText: "SIGN OUT",
            cancelText: "STAY",
            icon: "question"
        }).then((r) => {
            if (r.isConfirmed) window.location.href = "/admin/logout";
        });
    });
});