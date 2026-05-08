
/**
 * Global Page Loader Utility
 * Elegant, minimalist loader for AJAX delays and page transitions.
 */

(function() {
    const style = document.createElement('style');
    style.textContent = `
        #global-page-loader {
            position: fixed;
            inset: 0;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        #global-page-loader.active {
            opacity: 1;
            visibility: visible;
        }

        .loader-circles-container {
            display: flex;
            gap: 12px;
        }

        .loader-circle {
            width: 14px;
            height: 14px;
            background: #1C1C1C;
            border-radius: 50%;
            animation: loader-pulse 1s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .loader-circle:nth-child(2) { animation-delay: 0.2s; }
        .loader-circle:nth-child(3) { animation-delay: 0.4s; }

        @keyframes loader-pulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 1;
            }
            50% { 
                transform: scale(0.6);
                opacity: 0.3;
            }
        }

        .loader-text {
            margin-top: 24px;
            font-family: 'Outfit', sans-serif;
            font-size: 0.6rem;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #1C1C1C;
            opacity: 0.6;
        }
    `;
    document.head.appendChild(style);

    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'global-page-loader';
    loaderDiv.innerHTML = `
        <div class="loader-circles-container">
            <div class="loader-circle"></div>
            <div class="loader-circle"></div>
            <div class="loader-circle"></div>
        </div>
        <div class="loader-text">Loading Details</div>
    `;
    document.body.appendChild(loaderDiv);

    let loaderTimeout = null;
    let activeRequests = 0;

    window.pageLoader = {
        show: function() {
            if (loaderTimeout) clearTimeout(loaderTimeout);
            loaderDiv.classList.add('active');
        },
        hide: function() {
            loaderDiv.classList.remove('active');
        },
        // Only show if delay is more than 300ms
        showDelayed: function(delay = 300) {
            if (loaderTimeout) clearTimeout(loaderTimeout);
            loaderTimeout = setTimeout(() => {
                this.show();
            }, delay);
        }
    };

    // Axios Integration
    if (window.axios) {
        window.axios.interceptors.request.use(config => {
            activeRequests++;
            window.pageLoader.showDelayed(400); // Slightly longer for AJAX
            return config;
        }, error => {
            activeRequests--;
            if (activeRequests <= 0) window.pageLoader.hide();
            return Promise.reject(error);
        });

        window.axios.interceptors.response.use(response => {
            activeRequests--;
            if (activeRequests <= 0) {
                if (loaderTimeout) clearTimeout(loaderTimeout);
                window.pageLoader.hide();
            }
            return response;
        }, error => {
            activeRequests--;
            if (activeRequests <= 0) {
                if (loaderTimeout) clearTimeout(loaderTimeout);
                window.pageLoader.hide();
            }
            return Promise.reject(error);
        });
    }

    // Page Transition Integration
    window.addEventListener('beforeunload', () => {
        window.pageLoader.show();
    });
})();
