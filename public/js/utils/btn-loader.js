
/**
 * Button Loader Utility
 * Provides a consistent loading animation for buttons across the application.
 */

window.btnLoader = {
    /**
     * Shows a loading spinner on the button
     * @param {HTMLElement} btn - The button element
     * @param {string} text - Optional text to show (default: Processing...)
     */
    show: function(btn, text = 'Processing...') {
        if (!btn) return;

        if (btn.getAttribute('data-loading') === 'true') {
            // Just update the text if it's already loading
            const textSpan = btn.querySelector('[id$="Text"]') || btn.querySelector('.btn-text') || btn.querySelector('.flex > span');
            if (textSpan) textSpan.innerText = text;
            return;
        }

        // Save original state
        btn.setAttribute('data-original-content', btn.innerHTML);
        btn.setAttribute('data-loading', 'true');
        
        // Optional: save original width to prevent jumping
        const rect = btn.getBoundingClientRect();
        btn.style.width = rect.width + 'px';
        
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');

        // Check if button has the specific structure from return page
        const textSpan = btn.querySelector('[id$="Text"]') || btn.querySelector('.btn-text');
        const iconSpan = btn.querySelector('[id$="Icon"]') || btn.querySelector('.btn-icon');

        if (textSpan && iconSpan) {
            textSpan.innerText = text;
            iconSpan.innerHTML = this._getSpinnerSvg();
        } else {
            // Default replacement for any button
            btn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <span>${text}</span>
                    ${this._getSpinnerSvg()}
                </span>
            `;
        }
    },

    /**
     * Hides the loading spinner and restores the button's original content
     * @param {HTMLElement} btn - The button element
     */
    hide: function(btn) {
        if (!btn || btn.getAttribute('data-loading') !== 'true') return;

        const originalContent = btn.getAttribute('data-original-content');
        if (originalContent) {
            btn.innerHTML = originalContent;
        }

        btn.removeAttribute('data-loading');
        btn.removeAttribute('data-original-content');
        btn.style.width = '';
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    },

    /**
     * Internal helper to get the spinner SVG
     * @returns {string} SVG string
     */
    _getSpinnerSvg: function() {
        return `
            <svg class="animate-spin" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
        `;
    }
};
