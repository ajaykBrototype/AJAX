document.addEventListener('DOMContentLoaded', () => {
    /* UI ELEMENTS */
    const sb = document.getElementById('sidebar');
    const sbToggle = document.getElementById('sidebarToggle');
    const sbOverlay = document.getElementById('sidebarOverlay');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    /* SIDEBAR CONTROLS */
    function toggleSidebar() {
        if (sb) sb.classList.toggle('open');
        if (sbOverlay) sbOverlay.classList.toggle('hidden');
        document.body.classList.toggle('overflow-hidden');
    }

    if (sbToggle) sbToggle.addEventListener('click', toggleSidebar);
    if (sbOverlay) sbOverlay.addEventListener('click', toggleSidebar);

    /* ACTIONS: Access Control */
    window.toggleBlockUser = async function (userId, isBlocked) {
        const state = isBlocked === 'true';
        const action = state ? 'RESTORE ACCESS' : 'REVOKE ACCESS';
        
        const result = await ajaxConfirm({
            title: `${action}?`,
            text: state ? "This user will regain full access to the store." : "This user will be immediately blocked from all store activities.",
            confirmText: "YES, CONFIRM",
            cancelText: "CANCEL",
            icon: state ? 'question' : 'warning'
        });

        if (result.isConfirmed) {
            try {
                const res = await axios.patch(`/admin/toggleblockuser/${userId}`, {},
             {
                 withCredentials: true
               });
                if (res.data.success) {
                    ajaxToast('success', `Access ${state ? 'restored' : 'revoked'} successfully.`);
                    setTimeout(() => window.location.reload(), 1200);
                } else {
                    ajaxAlert('error', res.data.message);
                }
            } catch (err) {
                ajaxAlert('error', 'Operation failed. Please try again.');
            }
        }
    };

    /* FILTERS & SEARCH */
    let searchTimeout;
    function runFilters() {
        const q = searchInput ? searchInput.value.trim() : '';
        const s = statusFilter ? statusFilter.value : 'all';
        window.location.href = `/admin/users?page=1&search=${q}&status=${s}`;
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(runFilters, 500);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', runFilters);
    }

 
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); // 🔥 VERY IMPORTANT

    ajaxConfirm({
        title: "SIGN OUT?",
        text: "Ending your administrator session in AJAX.",
        confirmText: "SIGN OUT",
        cancelText: "STAY",
        icon: "question"
    }).then((r) => {
        if (r.isConfirmed) {
            window.location.href = "/admin/logout";
        }
    });
})
});