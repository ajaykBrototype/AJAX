
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
// Dynamic Styles for Ultra-Sleek Pill Toast
if (!document.getElementById('ajax-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ajax-toast-styles';
    style.innerHTML = `
        .swal2-container.modern-toast-wrapper { padding: 30px !important; }
        .modern-toast-popup {
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            overflow: visible !important;
            width: auto !important;
            max-width: 90vw !important;
        }
        .modern-toast-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.8rem 1.8rem;
            background: #121212;
            border-radius: 1.5rem;
            color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
            position: relative;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            animation: toastPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            width: 100%;
            max-width: 400px;
            box-sizing: border-box;
        }
        @keyframes toastPop {
            0% { transform: scale(0.8) translateY(-20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            position: relative;
        }
        .status-dot::after {
            content: '';
            position: absolute;
            top: -2px; left: -2px; right: -2px; bottom: -2px;
            border-radius: 50%;
            border: 2px solid currentColor;
            opacity: 0.3;
            animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
        }
        .success .status-dot { background: #10B981; color: #10B981; }
        .error .status-dot { background: #EF4444; color: #EF4444; }
        .warning .status-dot { background: #F59E0B; color: #F59E0B; }
        
        .toast-text-content {
            display: flex;
            flex-direction: column;
            gap: 1px;
            text-align: left;
            word-break: break-word;
        }
        .toast-label {
            font-size: 0.5rem;
            font-weight: 900;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.4);
        }
        .toast-message {
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.01em;
            line-height: 1.4;
        }
        .swal2-timer-progress-bar {
            bottom: 0 !important;
            height: 2px !important;
            background: rgba(255,255,255,0.1) !important;
            border-radius: 0 0 100px 100px !important;
        }
    `;
    document.head.appendChild(style);
}

window.ajaxToast = function(type, message, title = '') {
    const labels = { success: 'Confirmed', error: 'Alert', warning: 'Attention', info: 'Notice' };

    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'transparent',
        showClass: { popup: 'animate__animated animate__none' }, // Using custom CSS animation
        hideClass: { popup: 'animate__animated animate__fadeOutUp animate__faster' },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        html: `
            <div class="modern-toast-container ${type}">
                <div class="status-dot"></div>
                <div class="toast-text-content">
                    <span class="toast-label">${title || labels[type]}</span>
                    <span class="toast-message">${message}</span>
                </div>
            </div>
        `,
        customClass: {
            container: 'modern-toast-wrapper',
            popup: 'modern-toast-popup'
        }
    });
};

window.ajaxToast.success = function(message, title = '') {
    window.ajaxToast('success', message, title);
};
window.ajaxToast.error = function(message, title = '') {
    window.ajaxToast('error', message, title);
};
window.ajaxToast.warning = function(message, title = '') {
    window.ajaxToast('warning', message, title);
};
window.ajaxToast.info = function(message, title = '') {
    window.ajaxToast('info', message, title);
};
