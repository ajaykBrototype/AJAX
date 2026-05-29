const accountBtn = document.getElementById("accountBtn");
const accountMenu = document.getElementById("accountMenu");

accountBtn.addEventListener("click", () => {
  accountMenu.classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  if (!accountBtn.contains(e.target) && !accountMenu.contains(e.target)) {
    accountMenu.classList.add("hidden");
  }
});


async function confirmLogout() {
  try {
    await axios.get("/logout");
    if(typeof showToast === 'function') {
      showToast('success', 'Logged out successfully.');
    }
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  } catch (err) {
    window.location.href = "/login";
  }
}

function logout() {
  window.location.href = "/logout";
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("error") === "unavailable") {
    setTimeout(() => {
      if (typeof ajaxToast === 'function') {
        ajaxToast("error", "This product is currently unavailable.");
      }
    }, 300);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({path: newUrl}, '', newUrl);
  }
});