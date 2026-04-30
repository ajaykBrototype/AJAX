async function toggleWishlist(productId, elementOrEvent) {
  try {
    const res = await axios.post("/wishlist/add", { productId });

    if (res.data.success) {
      // Handle both inline 'this' and event listeners
      const btn = elementOrEvent instanceof Event ? elementOrEvent.currentTarget : elementOrEvent;
      const icon = btn ? btn.querySelector("i") : null;

      if (res.data.action === "added") {
        ajaxToast("success", "Added to wishlist ❤️");
        btn.classList.add("favorited", "text-red-500");
        if (icon) icon.classList.add("fill-red-500");

      } else {
        ajaxToast("success", "Removed from wishlist");
        btn.classList.remove("favorited", "text-red-500");
        if (icon) icon.classList.remove("fill-red-500");
      }

    } else {
      ajaxToast("error", res.data.message);
    }

  } catch (err) {
    console.log(err);

    if (err.response?.status === 401) {
      window.location.href = "/login";
      return;
    }

    ajaxToast("error", "Something went wrong");
  }
}