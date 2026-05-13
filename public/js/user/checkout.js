document.addEventListener("DOMContentLoaded", () => {

    lucide.createIcons();

    window.handleOrderCompletion = function (orderId) {
        const btn = document.getElementById('completeOrderBtn');

        btn.classList.add('order-btn-loading');
        btn.style.backgroundColor = 'white';
        btn.style.color = 'transparent';


        setTimeout(() => {
            ajaxToast("success", "Order Placed Successfully!");

            setTimeout(() => {
                window.location.href = `/order-success/${orderId}`;
            }, 2500); // Increased delay for toast visibility

        }, 2000);
    };

   
    window.toggleAddressModal = function (show) {
        const modal = document.getElementById('addressModal');

        if (show) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('active');
            if (!document.getElementById('addressFormModal').classList.contains('active')) {
                document.body.style.overflow = '';
            }
        }
    };

    window.toggleAddressFormModal = function (show) {
        const modal = document.getElementById('addressFormModal');

        if (show) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('active');
            if (!document.getElementById('addressModal').classList.contains('active')) {
                document.body.style.overflow = '';
            }
        }
    };

    window.toggleCouponsModal = async function (show) {
        const modal = document.getElementById('couponsModal');
        const container = document.getElementById('couponContainer');

        if (show) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Fetch Coupons
            try {
                const subtotal = document.getElementById('checkoutSubtotal').value;
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-20 text-stone-300">
                        <div class="w-8 h-8 border-2 border-dark/10 border-t-dark rounded-full animate-spin mb-4"></div>
                        <p class="text-[0.6rem] font-black tracking-widest uppercase">Fetching available offers...</p>
                    </div>
                `;

                const res = await axios.get(`/coupons/available?subtotal=${subtotal}`);
                
                if (res.data.success && res.data.coupons.length > 0) {
                    container.innerHTML = res.data.coupons.map(coupon => `
                        <div class="relative group ${!coupon.eligible ? 'opacity-80' : ''}" 
                             ${coupon.eligible ? `onclick="selectCoupon('${coupon.code}')"` : ''}>
                            <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FAF9F6] border-r border-brand-mist/30 rounded-full z-10"></div>
                            <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FAF9F6] border-l border-brand-mist/30 rounded-full z-10"></div>
                            
                            <div class="bg-white border border-brand-mist/30 rounded-[1.5rem] p-6 transition-all ${coupon.eligible ? 'hover:shadow-lg hover:shadow-dark/5 cursor-pointer' : ''} overflow-hidden relative">
                                <div class="flex justify-between items-start mb-4">
                                    <span class="px-4 py-1.5 bg-brand-warm border border-brand-mist/30 rounded-lg text-[0.6rem] font-black tracking-widest uppercase font-sans">${coupon.code}</span>
                                    <span class="text-[0.45rem] font-black tracking-widest ${coupon.eligible ? 'text-green-500 bg-green-50' : 'text-red-400 bg-red-50'} uppercase px-2 py-0.5 rounded-md font-sans">
                                        ${coupon.eligible ? 'Requirement met' : 'NOT ELIGIBLE'}
                                    </span>
                                </div>
                                
                                <h4 class="text-xl font-bold tracking-tight mb-1 font-sans ${!coupon.eligible ? 'text-stone-300' : 'text-brand-dark'}">
                                    ${coupon.discountType === 'flat' ? `₹${coupon.discountAmount}` : `${coupon.discountAmount}%`} OFF
                                </h4>
                                <p class="text-[0.65rem] font-medium text-stone-300 mb-6 font-sans">Save on your order with this exclusive coupon.</p>
                                
                                <div class="pt-4 border-t border-dashed border-brand-mist/30 flex justify-between items-center">
                                    <p class="text-[0.55rem] font-black text-stone-200 uppercase tracking-widest font-sans">Min. Purchase: ₹${coupon.minOrder}</p>
                                    ${!coupon.eligible ? `<span class="text-[0.5rem] font-black text-red-300 uppercase tracking-widest font-sans">Minimum not met</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = `
                        <div class="text-center py-20 px-10">
                            <i data-lucide="ticket-x" class="mx-auto text-stone-200 mb-4" size="32"></i>
                            <p class="text-[0.6rem] font-black tracking-widest text-stone-300 uppercase">No coupons available at this time</p>
                        </div>
                    `;
                    lucide.createIcons();
                }
            } catch (err) {
                console.error(err);
                container.innerHTML = `<p class="text-red-400 text-center py-10 text-xs">Failed to load coupons</p>`;
            }
        } else {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.selectCoupon = function (code) {
        const input = document.getElementById('couponCodeInput');
        if (input) {
            input.value = code;
            toggleCouponsModal(false);
            applyCoupon(); // Auto-apply when selected from modal
        }
    };

    let originalTotal = parseFloat(document.getElementById('checkoutTotalRaw').value);
    let currentDiscount = 0;

    window.applyCoupon = async function () {
        const code = document.getElementById('couponCodeInput').value.trim();
        const subtotal = parseFloat(document.getElementById('checkoutSubtotal').value);

        if (!code) {
            return ajaxToast("error", "Please enter a coupon code");
        }

        try {
            const res = await axios.post('/checkout/apply-coupon', { code, subtotal });

            if (res.data.success) {
                currentDiscount = res.data.discount;
                const newTotal = originalTotal - currentDiscount;

                // Update UI
                document.getElementById('discountRow').classList.remove('hidden');
                document.getElementById('discountValue').innerText = `-₹ ${currentDiscount.toFixed(2)}`;
                document.getElementById('totalPrice').innerText = `₹ ${newTotal.toFixed(2)}`;
                document.getElementById('orderBtnText').innerText = `Complete Order — ₹${newTotal.toFixed(2)}`;
                
                document.getElementById('applyCouponBtn').classList.add('hidden');
                document.getElementById('removeCouponBtn').classList.remove('hidden');
                document.getElementById('couponCodeInput').readOnly = true;

                ajaxToast("success", res.data.message);
            } else {
                ajaxToast("error", res.data.message);
            }
        } catch (err) {
            console.error(err);
            ajaxToast("error", "Something went wrong while applying coupon");
        }
    };

    window.removeCoupon = function () {
        currentDiscount = 0;
        
        // Update UI
        document.getElementById('discountRow').classList.add('hidden');
        document.getElementById('totalPrice').innerText = `₹ ${originalTotal.toFixed(2)}`;
        document.getElementById('orderBtnText').innerText = `Complete Order — ₹${originalTotal.toFixed(2)}`;
        
        document.getElementById('applyCouponBtn').classList.remove('hidden');
        document.getElementById('removeCouponBtn').classList.add('hidden');
        document.getElementById('couponCodeInput').readOnly = false;
        document.getElementById('couponCodeInput').value = '';

        ajaxToast("success", "Coupon removed");
    };

    window.closeAllModals = function () {
        toggleAddressModal(false);
        toggleAddressFormModal(false);
        toggleCouponsModal(false);
    };

  
    window.setLabel = function (label) {
        document.getElementById('addressLabelInput').value = label;

        document.querySelectorAll('.label-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`label-${label}`).classList.add('active');
    };

    window.openAddressForm = function (addressDataStr = null) {
        const form = document.getElementById('addressForm');
        const title = document.getElementById('addressFormTitle');

     
        form.querySelectorAll(".error-msg").forEach(e => {
            e.innerText = "";
            e.classList.add("hidden");
        });

        form.querySelectorAll(".form-input").forEach(input => {
            input.classList.remove("border-red-500");
        });

        if (addressDataStr) {
            const data = JSON.parse(addressDataStr);

            title.innerText = 'Edit Address';

            form.name.value = data.name || '';
            form.street.value = data.street || '';
            form.area.value = data.area || '';
            form.pincode.value = data.pincode || '';
            form.city.value = data.city || '';
            form.state.value = data.state || '';
            form.phone.value = data.phone || '';
            form.addressId.value = data._id;

            setLabel(data.type || 'Home');
            form.isDefault.checked = data.isDefault || false;

        } else {
            title.innerText = 'Add New Address';
            form.reset();
            form.addressId.value = "";
            setLabel('Home');
        }

        toggleAddressFormModal(true);
    };

   
    window.selectAddress = function (addressId) {
        window.location.href = `/checkout?addressId=${addressId}`;
    };

 
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input');
            if (radio.disabled) return;

            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            radio.checked = true;
        });
    });

  
    const form = document.getElementById("addressForm");
    if (!form) return;

    const getError = (input) => {
        return input.closest(".space-y-3").querySelector(".error-msg");
    };

    const showError = (input, message) => {
        const error = getError(input);
        if (!error) return;

        error.innerText = message;
        error.classList.remove("hidden");
        input.classList.add("border-red-500");
    };

    const clearError = (input) => {
        const error = getError(input);
        if (!error) return;

        error.innerText = "";
        error.classList.add("hidden");
        input.classList.remove("border-red-500");
    };

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;

        const fields = [
            form.name,
            form.street,
            form.pincode,
            form.city,
            form.area,
            form.state,
            form.phone
        ];

        fields.forEach(clearError);

        if (form.name.value.trim().length < 3) {
            showError(form.name, "Name must be at least 3 characters");
            isValid = false;
        }

        if (form.street.value.trim().length < 5) {
            showError(form.street, "Enter valid street");
            isValid = false;
        }

        if (!/^\d{6}$/.test(form.pincode.value)) {
            showError(form.pincode, "Pincode must be 6 digits");
            isValid = false;
        }

        if (form.city.value.trim().length < 2) {
            showError(form.city, "Enter valid city");
            isValid = false;
        }

        if (form.area.value.trim().length < 3) {
            showError(form.area, "Enter valid area");
            isValid = false;
        }

        if (form.state.value.trim().length < 2) {
            showError(form.state, "Enter valid state");
            isValid = false;
        }

        if (!/^\d{10}$/.test(form.phone.value)) {
            showError(form.phone, "Phone must be 10 digits");
            isValid = false;
        }

        if (isValid) {
            form.submit();
        }
    });

});

async function placeOrder() {
    try {
       const addressInput = document.getElementById("selectedAddressId");

         const selectedAddress = addressInput ? addressInput.value : null;

        if (!selectedAddress) {
            return ajaxToast("error", "Please select address");
        }

        const paymentMethod = document.querySelector(
            'input[name="payment"]:checked'
        ).value;

        const couponCodeInput = document.getElementById('couponCodeInput');
        const removeBtn = document.getElementById('removeCouponBtn');
        const couponCode = (removeBtn && !removeBtn.classList.contains('hidden')) ? couponCodeInput.value.trim() : null;

        const res = await axios.post("/order/place", {
            addressId: selectedAddress,
            paymentMethod,
            couponCode
        });

        if (res.data.success) {
            if (res.data.razorpayOrder) {
                // HANDLE RAZORPAY
                const options = {
                    key: "rzp_test_SoheRfzN69tfvZ", // Use the same key as in wallet.js
                    amount: res.data.razorpayOrder.amount,
                    currency: res.data.razorpayOrder.currency,
                    name: "AJAX Store",
                    description: "Order Payment",
                    order_id: res.data.razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await axios.post("/order/verify-payment", {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: res.data.orderId
                            });

                            if (verifyRes.data.success) {
                                handleOrderCompletion(res.data.orderId);
                            } else {
                                window.location.href = `/payment-failure?orderId=${res.data.orderId}&message=${verifyRes.data.message || 'Payment verification failed'}`;
                            }
                        } catch (err) {
                            console.log(err);
                            window.location.href = `/payment-failure?orderId=${res.data.orderId}&message=Something went wrong during verification`;
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            window.location.href = `/payment-failure?orderId=${res.data.orderId}&message=Payment was cancelled`;
                        }
                    },
                    theme: {
                        color: "#1C1C1C"
                    }
                };
                const rzp = new Razorpay(options);
                rzp.open();
            } else {
                // COD or WALLET
                handleOrderCompletion(res.data.orderId);
            }
        } else {
            ajaxToast("error", res.data.message || "Order failed");
        }

    } catch (err) {
        console.log(err);
        ajaxToast("error", "Something went wrong");
    }

}









async function loadCoupons() {

    try {

        const subtotal =
            Number(
                document
                .getElementById(
                    "checkoutSubtotal"
                ).value
            );

        const response =
            await axios.get(

            `/coupons/available?subtotal=${subtotal}`
        );

        const coupons =
            response.data.coupons;

        const container =
            document.getElementById(
                "couponContainer"
            );

        container.innerHTML = "";

        coupons.forEach(coupon => {
            const isEligible = coupon.eligible;
            const alreadyUsed = coupon.alreadyUsed;
            const reason = coupon.reason;

            container.innerHTML += `
            <div class="relative group ${!isEligible ? "opacity-60" : ""}">
                <div class="bg-white border border-brand-mist/30 rounded-[1.5rem] p-6">
                    <div class="flex justify-between items-start mb-4">
                        <span class="px-4 py-1.5 bg-brand-warm border border-brand-mist/30 rounded-lg text-[0.6rem] font-black tracking-widest uppercase">
                            ${coupon.code}
                        </span>
                        <span class="text-[0.45rem] font-black tracking-widest uppercase px-2 py-0.5 rounded-md
                        ${alreadyUsed ? "text-orange-500 bg-orange-50" : (isEligible ? "text-green-500 bg-green-50" : "text-red-400 bg-red-50")}">
                            ${reason}
                        </span>
                    </div>

                    <h4 class="text-xl font-bold tracking-tight mb-1">
                        ${coupon.discountType === "percentage" ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} OFF`}
                    </h4>
                    <p class="text-[0.65rem] font-medium text-stone-300 mb-6">
                        Save instantly on your order with this exclusive coupon.
                    </p>

                    <div class="pt-4 border-t border-dashed border-brand-mist/30 flex justify-between items-center">
                        <p class="text-[0.55rem] font-black text-stone-200 uppercase tracking-widest">
                            Min. Purchase: ₹${coupon.minOrder}
                        </p>
                        <span class="text-[0.45rem] font-black tracking-widest uppercase ${isEligible ? "text-green-500" : "text-red-400"}">
                            ${isEligible ? "Eligible" : reason}
                        </span>
                    </div>

                    <div class="mt-4">

    ${isEligible?

        `
        <button
            onclick="selectCoupon('${coupon.code}')"

            class="w-full bg-black text-white py-3 rounded-xl text-[0.6rem] font-black tracking-widest uppercase hover:bg-stone-800 transition-all">

            Apply Coupon
        </button>
        `

        :

        `
        <button
            disabled

            class="w-full bg-stone-100 text-stone-400 py-3 rounded-xl text-[0.6rem] font-black tracking-widest uppercase cursor-not-allowed">

            ${reason}
        </button>
        `
    }

</div>
                </div>
            </div>
            `;
        });

    } catch (err) {

        console.log(err);
    }
}