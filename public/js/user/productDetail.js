const qtyValue = document.getElementById("qtyValue");
const increaseBtn = document.getElementById("increase");
const decreaseBtn = document.getElementById("decrease");
const stepper = document.querySelector(".quantity-stepper");

function showError(msg) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: msg,
            showConfirmButton: false,
            timer: 3000,
            background: '#1c1c1c',
            color: '#ffffff'
        });
    } else {
        alert(msg);
    }
}

// ➕ INCREASE
increaseBtn.addEventListener("click", async () => {
    const currentVariantId = stepper.dataset.variant;
    const currentStock = parseInt(stepper.dataset.stock) || 0;
    const currentQty = parseInt(qtyValue.innerText) || 1;

    if (!currentVariantId) {
        return showError("Please select color and size first");
    }

    if (currentStock <= 0) {
        return showError("This variant is currently out of stock");
    }

    const newQty = currentQty + 1;

    if (newQty > 5) {
        return showError("Maximum 5 units per item allowed in bag");
    }

    if (newQty > currentStock) {
        return showError(`Only ${currentStock} items available`);
    }

    try {
        const res = await axios.post("/check-quantity", {
            variantId: currentVariantId,
            quantity: newQty
        });

        if (!res.data.success) {
            return showError(res.data.message);
        }

        qtyValue.innerText = newQty;

    } catch (err) {
        console.log("ERROR:", err);
        showError("Server error checking quantity");
    }
});

// ➖ DECREASE
decreaseBtn.addEventListener("click", () => {
    const currentQty = parseInt(qtyValue.innerText) || 1;
    if (currentQty > 1) {
        qtyValue.innerText = currentQty - 1;
    }
});


const addBtn=document.getElementById("addToBagBtn");

addBtn.addEventListener("click",async()=>{
    try{
       if(!state.selectedVariant){
        return ajaxToast("error","Please Select Size");
       }
       const qty=parseInt(document.getElementById("qtyValue").innerText);

       const res=await axios.post("/cart/add",{
        variantId:state.selectedVariant._id,
         quantity:qty
       });
        if (res.data.success) {
            // Update navbar cart count
            const cartBadge = document.getElementById('cart-count-badge');
            if (cartBadge && res.data.cartCount !== undefined) {
                cartBadge.textContent = res.data.cartCount;
                if (res.data.cartCount > 0) {
                    cartBadge.classList.remove('hidden');
                }
            }
            
            if (res.data.alreadyInCart) {
                ajaxToast("success", "Item already in bag (max reached)");
            } else {
                ajaxToast("success", "Successfully added to bag");
            }
        } else {
            ajaxToast("error", res.data.message);
        }
    }catch(err){
        console.log("CART ADD ERROR:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            const currentPath = window.location.pathname;
            window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
            return;
        }
    ajaxToast("error", "Something went wrong");
    }
})

// Wishlist toggle
document.addEventListener('click', async (e) => {
    const wishlistBtn = e.target.closest('.wishlist-toggle, .btn-secondary');
    if (!wishlistBtn) return;

    if (typeof currentProductId !== 'undefined' && typeof toggleWishlist === 'function') {
        const variantId = state.selectedVariant?._id || stepper.dataset.variant;
        
        if (!variantId) {
            return ajaxToast("error", "Please select a color and size first");
        }

        await toggleWishlist(currentProductId, wishlistBtn, variantId);
        
        // Save preferred variant locally for quick loading
        if (state.selectedVariant) {
            let prefs = JSON.parse(localStorage.getItem('wishlistPrefs') || '{}');
            prefs[currentProductId] = state.selectedVariant._id;
            localStorage.setItem('wishlistPrefs', JSON.stringify(prefs));
        }
    }
});


        lucide.createIcons();

        window.addEventListener('load', () => {
    
            if (document.querySelector('.main-image')) {
                gsap.from('.main-image', {
                    scale: 1.1,
                    duration: 1.5,
                    ease: "power2.out"
                });
            }

            gsap.to('.reveal', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        });

  
        function switchImage(src, thumb) {
            const mainImg = document.getElementById('mainImage');
            
       
            gsap.to(mainImg, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    mainImg.src = src;
                    gsap.to(mainImg, { opacity: 1, duration: 0.4 });
                }
            });

            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active-thumb'));
            thumb.classList.add('active-thumb');
        }


        let state = {
            selectedColor: null,
            selectedVariant: null
        };

        function updateActionButtons() {
            const btn = document.getElementById('addToBagBtn');
            const wishlistBtns = document.querySelectorAll('.wishlist-toggle, .btn-secondary');
            const stock = state.selectedVariant ? parseInt(state.selectedVariant.stock) : 0;
            
            // Update Add to Bag Button
            if (state.selectedColor && state.selectedVariant && stock > 0) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.innerHTML = 'Add to Bag <i data-lucide="arrow-right" size="14"></i>';
                lucide.createIcons();
            } else if (state.selectedVariant && stock <= 0) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.innerHTML = 'Out of Stock';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.innerHTML = 'Add to Bag <i data-lucide="arrow-right" size="14"></i>';
                lucide.createIcons();
            }

            // Update Wishlist Buttons based on selected variant
            if (state.selectedVariant && typeof wishlistedVariants !== 'undefined') {
                const isFavorited = wishlistedVariants.includes(state.selectedVariant._id);
                wishlistBtns.forEach(wBtn => {
                    const heartIcon = wBtn.querySelector('i, svg');
                    if (isFavorited) {
                        wBtn.classList.add('favorited', 'text-red-500');
                        if (heartIcon) heartIcon.classList.add('fill-red-500');
                    } else {
                        wBtn.classList.remove('favorited', 'text-red-500');
                        if (heartIcon) heartIcon.classList.remove('fill-red-500');
                    }
                });
            }
        }

   
        document.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');

                const color = swatch.dataset.color;
                const colorVariants = JSON.parse(swatch.dataset.variants);
                const firstVariant = colorVariants[0];

                state.selectedColor = color;
                state.selectedVariant = null; // Reset size on color change

          
                document.getElementById('colorLabel').textContent = `Color — ${color}`;
                
        
                updateGallery(firstVariant.images);
                
        
                document.getElementById('productPrice').textContent = `₹${firstVariant.price}`;
                document.getElementById('originalPrice').textContent = `₹${Math.round(firstVariant.price * 1.4)}`;

                 updateStockDisplay(firstVariant.stock);

        const stepper = document.querySelector('.quantity-stepper');
        if (stepper) {
            stepper.dataset.stock = firstVariant.stock;
            stepper.dataset.variant = firstVariant._id;
        }

                renderSizeGrid(colorVariants);
                
              
                const qtyVal = document.getElementById('qtyValue');
                if (qtyVal) qtyVal.textContent = '1';

                updateActionButtons();
            });
        });

        function renderSizeGrid(variants) {
            const grid = document.getElementById('sizeGrid');
            grid.innerHTML = '';
            
            variants.forEach(v => {
                const btn = document.createElement('button');
                btn.className = 'size-btn';
                btn.textContent = v.size;
                btn.dataset.id = v._id;
                btn.dataset.stock = v.stock;
                
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    state.selectedVariant = v;
                    
                    
                    updateStockDisplay(v.stock);
                    
                    const stepper = document.querySelector('.quantity-stepper');
                    if (stepper) {
                        stepper.dataset.stock = v.stock;
                        stepper.dataset.variant = v._id;
                    }

                    updateActionButtons();
                });
                
                grid.appendChild(btn);
            });
        }

        function updateStockDisplay(stock) {
            const stockStatus = document.getElementById('stockStatus');
            const stockInfoContainer = document.getElementById('stockInfoContainer');
            if (parseInt(stock) < 5) {
                stockInfoContainer.className = 'stock-info stock-low';
                stockStatus.textContent = `Limited Stock: Only ${stock} left`;
            } else {
                stockInfoContainer.className = 'stock-info stock-in';
                stockStatus.textContent = 'In Stock & Ready to Ship';
            }
        }

        function updateGallery(images) {
            const thumbStrip = document.querySelector('.thumbnail-strip');
            if (thumbStrip && images.length > 0) {
                thumbStrip.innerHTML = '';
                images.forEach((img, idx) => {
                    const thumb = document.createElement('div');
                    thumb.className = `thumbnail ${idx === 0 ? 'active-thumb' : ''}`;
                    thumb.setAttribute('onclick', `switchImage('${img}', this)`);
                    thumb.innerHTML = `<img src="${img}" alt="View ${idx + 1}">`;
                    thumbStrip.appendChild(thumb);
                });
                switchImage(images[0], thumbStrip.firstChild);
            }
        }

        // Image Zoom Logic
        const imageContainer = document.querySelector('.main-image-container');
        const mainImage = document.getElementById('mainImage');

        imageContainer.addEventListener('mousemove', (e) => {
            const rect = imageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            mainImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            mainImage.style.transform = "scale(2)";
        });

        imageContainer.addEventListener('mouseleave', () => {
            mainImage.style.transform = "scale(1)";
            mainImage.style.transformOrigin = "center center";
        });
   