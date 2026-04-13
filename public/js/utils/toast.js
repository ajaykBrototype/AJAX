/**
 * Global Toast Notification Handler
 * Use this to display success, error, or warning toasts across the application.
 */

window.showToast = function(type, message, duration = 2500) {
  const toast = document.getElementById("global-toast");
  const msgEl = document.getElementById("global-toast-msg");
  const indicator = document.getElementById("toast-indicator");

  if (!toast) {
    console.warn("showToast failed: Toast component not found in DOM.");
    return;
  }

  // Clear previous timeouts and states
  if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
  
  // Set icons based on type
  let iconHtml = '';
  toast.className = 'global-toast'; // Reset classes

  switch (type) {
    case 'success':
      toast.classList.add('success');
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      break;
    case 'error':
      toast.classList.add('error');
      // Subtle alert indicator
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      break;
    case 'warning':
      toast.classList.add('warning');
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      break;
    default:
      iconHtml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  // Inject content
  indicator.innerHTML = iconHtml;
  msgEl.textContent = message;

  // Show
  toast.classList.add('show');

  // Auto hide
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};
