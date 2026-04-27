
        lucide.createIcons();

        function recalculate() {
            let subtotal = 0;
            const items = document.querySelectorAll('.bag-card:not(.item-exit)');
            
            // If we just removed the last item, reload to show empty state
            if (items.length === 0) {
                // Check if we are ALREADY showing the empty state container
                const emptyState = document.querySelector('.empty-state-container');
                if (!emptyState) {
                    window.location.reload();
                }
                return;
            }

            items.forEach(card => {
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

            // If bag is empty after removal, we might want to reload to show empty state
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
                return ajaxToast("error", "Maximum 5 items allowed");
            }

            try {
              
                qtyEl.innerText = newQty;
                recalculate();

                const res = await axios.post('/cart/update', { itemId, delta });
                
                if (!res.data.success) {
                    // Revert if failed
                    qtyEl.innerText = currentQty;
                    recalculate();
                    ajaxToast("error", res.data.message);
                }
            } catch (err) {
                console.log(err);
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
                console.log(err);
            }
        }

        window.addEventListener('load', recalculate);

