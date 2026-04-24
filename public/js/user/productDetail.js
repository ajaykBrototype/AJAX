const qtyValue = document.getElementById("qtyValue");
const increaseBtn = document.getElementById("increase");
const decreaseBtn = document.getElementById("decrease");

const stepper = document.querySelector(".quantity-stepper");

const stock = parseInt(stepper.dataset.stock);
const variantId = stepper.dataset.variant;

let qty = 1;
const MAX_LIMIT = 5;

function updateUI() {
  qtyValue.innerText = qty;
}

function showError(msg) {
  ajaxToast("error", msg);
}

// ➕ INCREASE
increaseBtn.addEventListener("click", async () => {

  const newQty = qty + 1;

  console.log("TRY:", newQty); // ✅ debug

  try {
    const res = await axios.post("/check-quantity", {
      variantId,
      quantity: newQty
    });

    console.log("RESPONSE:", res.data); // ✅ debug

    if (!res.data.success) {
      return showError(res.data.message);
    }

    qty = newQty;
    updateUI();

  } catch (err) {
    console.log("ERROR:", err);
    showError("Server error");
  }

});

// ➖ DECREASE
decreaseBtn.addEventListener("click", () => {
  if (qty > 1) {
    qty--;
    updateUI();
  }
});