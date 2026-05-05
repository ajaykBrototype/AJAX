document.addEventListener("DOMContentLoaded", () => {

    lucide.createIcons();

    window.handleOrderCompletion = function () {
        const btn = document.getElementById('completeOrderBtn');

        btn.classList.add('order-btn-loading');
        btn.style.backgroundColor = 'white';
        btn.style.color = 'transparent';


        setTimeout(() => {
            ajaxToast("success", "Order Placed Successfully!");

              setTimeout(() => {
            window.location.href =  `/order-success/${orderId}`;
        }, 800);

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

    window.closeAllModals = function () {
        toggleAddressModal(false);
        toggleAddressFormModal(false);
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

        const res = await axios.post("/order/place", {
            addressId: selectedAddress,
            paymentMethod
        });

        if (res.data.success) {
            handleOrderCompletion(res.data.orderId); // animation
            setTimeout(() => {
                window.location.href = `/order-success/${res.data.orderId}`;
            }, 2000);
        } else {
            ajaxToast("error", res.data.message || "Order failed");
        }

    } catch (err) {
        console.log(err);
        ajaxToast("error", "Something went wrong");
    }
}