
const AJAX_SWAL_COMMON = {
    background: '#FAFAF8', // --brand-warm
    color: '#1C1C1C',      // --brand-dark
    confirmButtonColor: '#1C1C1C',
    cancelButtonColor: '#B04040',
    fontFamily: "'DM Sans', sans-serif",
    backdrop: `rgba(28, 28, 28, 0.4)`,
    showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
    }
};


window.ajaxAlert = function(type, message, title = '') {
    const icons = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    return Swal.fire({
        ...AJAX_SWAL_COMMON,
        icon: icons[type] || 'info',
        title: title || type.toUpperCase(),
        text: message,
        confirmButtonText: 'CONTINUE',
        customClass: {
            title: 'ajax-swal-title',
            popup: 'ajax-swal-popup',
            confirmButton: 'ajax-swal-btn'
        }
    });
};

/**
 * Confirmation Modal (e.g. for Delete, Block, Logout)
 */
window.ajaxConfirm = function({ title, text, confirmText, cancelText, icon = 'warning' }) {
    return Swal.fire({
        ...AJAX_SWAL_COMMON,
        icon: icon,
        title: title || 'ARE YOU SURE?',
        text: text || "This action cannot be undone.",
        showCancelButton: true,
        confirmButtonText: confirmText || 'PROCEED',
        cancelButtonText: cancelText || 'CANCEL',
        customClass: {
            title: 'ajax-swal-title',
            popup: 'ajax-swal-popup',
            confirmButton: 'ajax-swal-btn',
            cancelButton: 'ajax-swal-btn-secondary'
        }
    });
};

/**
 * Success Toast (Matches SweetAlert2's internal toast system)
 */
window.ajaxToast = function(type, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1C1C1C',
        color: '#FFFFFF',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
};
