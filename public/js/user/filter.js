function toggleSidebar(open) {
  document.body.classList.toggle('sidebar-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function debounce(func, timeout = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

window.filters = {
  search: "",
  sort: "",
  category: "",
  minPrice: 0,
  maxPrice: 10000
};

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const minRange = document.getElementById("minPriceRange");
  const maxRange = document.getElementById("maxPriceRange");
  const minLabel = document.getElementById("minPriceLabel");
  const maxLabel = document.getElementById("maxPriceLabel");
  const highlight = document.getElementById("priceHighlight");

  function updatePriceSlider() {
    let minVal = parseInt(minRange.value);
    let maxVal = parseInt(maxRange.value);

    if (maxVal - minVal < 500) {
      if (this === minRange) {
        minRange.value = maxVal - 500;
      } else {
        maxRange.value = minVal + 500;
      }
    }

    minVal = parseInt(minRange.value);
    maxVal = parseInt(maxRange.value);

    window.filters.minPrice = minVal;
    window.filters.maxPrice = maxVal;

    minLabel.innerText = `₹${minVal}`;
    maxLabel.innerText = `₹${maxVal}`;

    const percent1 = (minVal / minRange.max) * 100;
    const percent2 = (maxVal / maxRange.max) * 100;

    highlight.style.left = percent1 + "%";
    highlight.style.width = (percent2 - percent1) + "%";
  }

  if (minRange && maxRange) {
    minRange.addEventListener("input", updatePriceSlider);
    maxRange.addEventListener("input", updatePriceSlider);
    updatePriceSlider(); // Initial update
  }

  // 🔍 SEARCH (sidebar)
  const searchInput = document.getElementById("sidebarSearch");
  const debouncedApply = debounce(() => applyFilters(), 500);

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      window.filters.search = e.target.value;
      debouncedApply();
    });
  }

  // 🔍 SEARCH (toolbar)
  const toolbarSearch = document.getElementById("toolbarSearch");
  if (toolbarSearch) {
    toolbarSearch.addEventListener("input", (e) => {
      window.filters.search = e.target.value;
      if (searchInput) searchInput.value = e.target.value;
      debouncedApply();
    });
    toolbarSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });
  }

  document.querySelectorAll(".cat-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.filters.category = btn.dataset.cat;
    });
  });

  document.querySelectorAll(".sort-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sort-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      window.filters.sort = btn.dataset.sort;
    });
  });

  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      window.filters.sort = e.target.value;
      applyFilters();
    });
  }
});

window.triggerToolbarSearch = function () {
  const toolbarSearch = document.getElementById("toolbarSearch");
  if (toolbarSearch && toolbarSearch.value.trim()) {
    window.filters.search = toolbarSearch.value;
    applyFilters();
  }
};

window.applyFilters = async function () {
  const container = document.getElementById("productGrid");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const params = new URLSearchParams(window.filters);
    const res = await axios.get(`/api/products?${params.toString()}`, {
      withCredentials: true
    });

    if (!res.data.success) {
      container.innerHTML = "<p>Failed to load</p>";
      return;
    }

    if (!res.data.products.length) {
      container.innerHTML = "<p>No products found</p>";
      return;
    }

    renderProducts(res.data.products);
    toggleSidebar(false);

  } catch (err) {
    console.log("ERROR:", err);
    container.innerHTML = "<p>Something went wrong</p>";
  }
};

window.clearAllFilters = function () {
  window.location.href = '/menProductList';
};

function renderProducts(products) {
  const container = document.getElementById("productGrid");

  if (!products.length) {
    container.innerHTML = `<p class="col-span-4 text-center text-gray-500 mt-10">No products found</p>`;
    return;
  }

  container.innerHTML = products.map(p => {
    const v = p.variants?.[0] || {};
    const primaryImg = v.images?.[0] || '';
    const secondaryImg = v.images?.[1] || '';

    return `
      <a href="/product/${p._id}" class="block">
        <div class="product-card group">
          <div class="product-img-wrap relative bg-[#F9F9F7] aspect-[3/4] overflow-hidden mb-4">
            <button class="wishlist-btn absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" onclick="event.preventDefault()">
              <i data-lucide="heart" size="18" stroke-width="1.5"></i>
            </button>
            <img src="${primaryImg}" alt="${p.name}" class="primary-img w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
            ${secondaryImg ? `<img src="${secondaryImg}" alt="${p.name}" class="secondary-img w-full h-full object-cover" />` : ''}
            <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/80 backdrop-blur-sm">
              <p class="text-[0.55rem] font-black tracking-[0.2em] text-center uppercase">Quick View</p>
            </div>
          </div>
          <div class="product-info space-y-1">
            <h3 class="text-[0.7rem] font-bold tracking-[0.05em] uppercase text-[#1C1C1C]">${p.name}</h3>
            <p class="text-[0.75rem] font-medium text-stone-500">₹${v.price || ''}</p>
          </div>
        </div>
      </a>
    `;
  }).join("");

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
