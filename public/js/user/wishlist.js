async function toggleWishlist(productId, elementOrEvent, variantId = null) {
  try {
    // If variantId is not provided, try to find it from the element's data attributes
    const btn = elementOrEvent instanceof Event ? elementOrEvent.currentTarget : elementOrEvent;
    const finalVariantId = variantId || btn.dataset.variantId;

    const res = await axios.post("/wishlist/add", { 
        productId, 
        variantId: finalVariantId 
    });

    if (res.data.success) {
      // Handle both inline 'this' and event listeners
      const btn = elementOrEvent instanceof Event ? elementOrEvent.currentTarget : elementOrEvent;
      const icon = btn ? btn.querySelector("i, svg") : null;

      if (res.data.action === "added") {
        ajaxToast("success", "Added to wishlist ❤️");
        btn.classList.add("favorited", "text-red-500");
        if (icon) icon.classList.add("fill-red-500");
        // Update local wishlistedVariants if on product detail page
        if (typeof wishlistedVariants !== 'undefined' && finalVariantId) {
            wishlistedVariants.push(finalVariantId);
        }
      } else {
        ajaxToast("success", "Removed from wishlist");
        btn.classList.remove("favorited", "text-red-500");
        if (icon) icon.classList.remove("fill-red-500");
        // Update local wishlistedVariants if on product detail page
        if (typeof wishlistedVariants !== 'undefined' && finalVariantId) {
            wishlistedVariants = wishlistedVariants.filter(v => v !== finalVariantId);
        }
      }

      // Update wishlist count badge in navbar
      const badge = document.getElementById("wishlist-count-badge");
      if (badge && res.data.count !== undefined) {
        badge.innerText = res.data.count;
        if (res.data.count > 0) {
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
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