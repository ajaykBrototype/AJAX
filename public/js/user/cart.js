
        lucide.createIcons();

        function updateDisplays(data) {
            const subtotalDisplays = document.querySelectorAll('.subtotal-display');
            const savingsDisplays = document.querySelectorAll('.savings-display');
            const totalDisplays = document.querySelectorAll('.total-display');

            if (data.subtotal !== undefined) {
                subtotalDisplays.forEach(el => el.innerText = `₹${Math.round(data.subtotal)}`);
            }
            if (data.totalDiscount !== undefined) {
                savingsDisplays.forEach(el => el.innerText = `- ₹${Math.round(data.totalDiscount)}`);
            }
            if (data.totalPrice !== undefined) {
                totalDisplays.forEach(el => el.innerText = `₹${Math.round(data.totalPrice)}`);
            }
        }

        function recalculate() {
            let subtotal = 0;
            const items = document.querySelectorAll('.bag-card:not(.item-exit)');
            const checkoutBtn = document.getElementById('checkoutBtn');
            
            if (items.length === 0) {
                const emptyState = document.querySelector('.empty-state-container');
                if (!emptyState) {
                    window.location.reload();
                }
                return;
            }

            const hasUnavailable = Array.from(items).some(card => card.dataset.unavailable === 'true');

            if (checkoutBtn) {
                if (hasUnavailable) {
                    checkoutBtn.classList.add('disabled');
                    checkoutBtn.setAttribute('title', 'Remove unavailable items to proceed');
                } else {
                    checkoutBtn.classList.remove('disabled');
                    checkoutBtn.removeAttribute('title');
                }
            }
        }

        async function proceedToCheckout() {
            const unavailableCards = document.querySelectorAll('.bag-card[data-unavailable="true"]:not(.item-exit)');

            if (unavailableCards.length > 0) {
                // Block checkout and inform the user — do NOT auto-remove
                ajaxToast("error", "Some products in your bag are currently unavailable. Please remove them before proceeding.");
                return;
            }

            window.location.href = "/checkout";
        }

        async function updateQty(itemId, delta) {
            const card = document.querySelector(`.bag-card[data-id="${itemId}"]`);
            if (!card) return;

            const qtyEl = card.querySelector('.qty-val');
            const currentQty = parseInt(qtyEl.innerText);
            const newQty = currentQty + delta;

            if (newQty < 1) return;
            if (newQty > 5) {
                return ajaxToast("error", "Maximum 5 units per item allowed in bag");
            }

            try {
              
                const res = await axios.patch('/cart/update', { itemId, delta });
                
                if (res.data.success) {
                    qtyEl.innerText = res.data.qty;
                    updateDisplays(res.data);
                    recalculate();
                } else {
                    ajaxToast("error", res.data.message);
                    recalculate();
                }
            } catch (err) {
                console.log("QTY UPDATE ERROR:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    window.location.href = "/login?returnTo=" + encodeURIComponent(window.location.pathname);
                    return;
                }
                qtyEl.innerText = currentQty;
                recalculate();
            }
        }

        async function removeItem(itemId) {
            const card = document.querySelector(`.bag-card[data-id="${itemId}"]`);
            if (!card) return;

            try {
                const res = await axios.post('/cart/remove', { itemId });

                if (res.data.success) {
                  
                    card.classList.add('item-exit');
                     ajaxToast("success", "Item removed from bag");
                    
                    setTimeout(() => {
                        card.remove();
                        recalculate();
                       
                    }, 1000);
                } else {
                    ajaxToast("error", res.data.message);
                }
            } catch (err) {
                console.log("REMOVE ITEM ERROR:", err);
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    window.location.href = "/login?returnTo=" + encodeURIComponent(window.location.pathname);
                    return;
                }
            }
        }

        window.addEventListener('load', recalculate);

