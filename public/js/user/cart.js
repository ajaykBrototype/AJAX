
        lucide.createIcons();

        function recalculate() {
            let subtotal = 0;
            const items = document.querySelectorAll('.bag-card:not(.item-exit)');
            
           
            if (items.length === 0) {
              
                const emptyState = document.querySelector('.empty-state-container');
                if (!emptyState) {
                    window.location.reload();
                }
                return;
            }

            items.forEach(card => {
                if (card.classList.contains('grayscale')) return; // Skip out of stock
                
                const price = parseFloat(card.dataset.price) || 0;
                const qtyVal = card.querySelector('.qty-val');
                if (qtyVal) {
                    const qty = parseInt(qtyVal.innerText) || 0;
                    subtotal += price * qty;
                }
            });

            const subtotalDisplays = document.querySelectorAll('.subtotal-display');
            const totalDisplays = document.querySelectorAll('.total-display');

            subtotalDisplays.forEach(el => el.innerText = `₹${subtotal.toFixed(2)}`);
            totalDisplays.forEach(el => el.innerText = `₹${subtotal.toFixed(2)}`);

           
            if (items.length === 0) {
                window.location.reload();
            }
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
              
                qtyEl.innerText = newQty;
                recalculate();

                const res = await axios.patch('/cart/update', { itemId, delta });
                
                if (!res.data.success) {
                    // Revert if failed
                    qtyEl.innerText = currentQty;
                    recalculate();
                    ajaxToast("error", res.data.message);
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
                    // Disappearing Animation
                    card.classList.add('item-exit');
                    
                    setTimeout(() => {
                        card.remove();
                        recalculate();
                        ajaxToast("success", "Item removed from bag");
                    }, 500);
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

