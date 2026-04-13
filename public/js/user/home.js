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