async function updateQty(itemId,delta){
    try{
      const res= await axios.post("/cart/update",{itemId,delta});
       
       if (!res.data.success) {
      return ajaxToast(res.data.message);
    }

     const itemRow = document.querySelector(`[data-id="${itemId}"]`);
    itemRow.querySelector(".qty-val").innerText = res.data.qty;

    document.querySelector("#totalPrice").innerText = "₹" + res.data.total;
    document.querySelector("#subtotal").innerText = "₹" + res.data.total;

    }catch(err){
      console.log(err);
    }
}

function recalcTotal() {
  let total = 0;

  document.querySelectorAll(".bag-item").forEach(item => {
    const price = parseFloat(item.querySelector(".item-price").innerText.replace("₹", ""));
    const qty = parseInt(item.querySelector(".qty-val").innerText);

    total += price * qty;
  });

  document.getElementById("subtotal").innerText = "₹" + total;
  document.getElementById("totalPrice").innerText = "₹" + total;
}

async function removeItem(itemId) {
    const itemRow = document.querySelector(`[data-id="${itemId}"]`);
    if (!itemRow) return;

    try {
        const res = await axios.post("/cart/remove", { itemId });

        if (res.data.success) {
            ajaxToast(success,"Product removed")
            // Start animation
            itemRow.classList.add('item-exit');
            
            // Wait for animation to finish before reload
            setTimeout(() => {
                itemRow.remove();
                recalcTotal();
                window.location.reload(); 
            }, 500);
        }
    } catch (err) {
        console.log("REMOVE ERROR:", err);
    }
}
