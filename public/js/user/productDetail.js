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
      window.location.href = "/cart"; 
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