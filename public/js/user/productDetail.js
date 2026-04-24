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
        return showError("Maximum 5 items allowed");
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