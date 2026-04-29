document.addEventListener('DOMContentLoaded', () => {
    /* UI ELEMENTS */
    const m = document.getElementById('categoryModal');
    const mc = document.getElementById('modalContent');
    const sb = document.getElementById('sidebar');
    const sbToggle = document.getElementById('sidebarToggle');
    const sbOverlay = document.getElementById('sidebarOverlay');

    /* MODAL ACCESSORS (Internal) */
    const showModal = () => {
        m.classList.remove('hidden');
        m.classList.add('flex');
        setTimeout(() => {
            mc.classList.remove('scale-95', 'opacity-0');
            mc.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    window.closeModal = function () {
        mc.classList.remove('scale-100', 'opacity-100');
        mc.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            m.classList.add('hidden');
            m.classList.remove('flex');
        }, 200);
    };

    /* EXPOSED HELPERS */
    window.openModal = function () {
        document.getElementById('modalTitle').textContent = 'New Category';
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryStatus').checked = true;
        document.getElementById('saveBtn').textContent = 'Create Entry';
        showModal();
    };
     
    window.handleEdit = function(btn) {
    const id = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');
    const status = btn.getAttribute('data-status') === 'true'; // Converts string to boolean
    
    // Calls your existing function below
    window.openEditModal(id, name, status);
};

    window.openEditModal = function (id, name, status) {
        document.getElementById('modalTitle').textContent = 'Update Category';
        document.getElementById('categoryId').value = id;
        document.getElementById('categoryName').value = name;
        document.getElementById('categoryStatus').checked = (status === true || status === 'true');
        document.getElementById('saveBtn').textContent = 'Apply Updates';
        showModal();
    };

    /* ACTIONS */
    window.saveCategory = async function () {
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const isActive = document.getElementById('categoryStatus').checked;

        if (!name) {
            ajaxToast('warning', 'Category name is required.');
            return;
        }

        try {
            let res;
            if (id) {
                res = await axios.patch(`/admin/categories/${id}`, { name, isActive });
            } else {
                res = await axios.post("/admin/categories/add", { name, isActive });
            }

            if (res.data.success) {
                window.closeModal();
                ajaxToast('success', res.data.message || 'Category saved.');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) {
            window.closeModal();
            ajaxAlert('error', err.response?.data?.message || 'Failed to save category.');
        }
    };

    window.toggleCategory = async function (id, el) {
        try {
            const res = await axios.patch(`/admin/categories/toggle/${id}`);
            if (res.data.success) {
                const isChecked = el.checked;
                const pill = el.closest("tr").querySelector(".status-pill");
                if (isChecked) {
                    pill.textContent = "VISIBLE";
                    pill.className = "status-pill status-active";
                    ajaxToast('success', 'Category set to visible.');
                } else {
                    pill.textContent = "HIDDEN";
                    pill.className = "status-pill status-inactive";
                    ajaxToast('info', 'Category hidden from store.');
                }
            } else {
                el.checked = !el.checked;
                ajaxAlert('error', res.data.message || 'Toggle failed.');
            }
        } catch (err) {
            el.checked = !el.checked;
            ajaxAlert('error', 'Network or server error during toggle.');
        }
    };

    window.deleteCategory = async function (id) {
        const result = await ajaxConfirm({
            title: "DELETE CATEGORY?",
            text: "This will remove the category and all associated product links.",
            confirmText: "DELETE",
            cancelText: "CANCEL",
            icon: "warning"
        });

        if (!result.isConfirmed) return;

        try {
            const res = await axios.delete(`/admin/categories/${id}`);
            if (res.data.success) {
                ajaxToast('success', 'Category deleted.');
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) {
            ajaxAlert('error', 'Failed to delete category.');
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
    document.getElementById('logoutAdmin')?.addEventListener('click', () => {
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