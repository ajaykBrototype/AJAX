const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 

    const data = Object.fromEntries(new FormData(e.target));

    try {
      const res = await axios.post("/login", data);

      if (res.data.success) {
        ajaxToast('success', res.data.message || 'Login successful!');
        
        // Get returnTo from URL if exists
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');

        setTimeout(() => {
          window.location.href = returnTo || res.data.redirect || '/';
        }, 1500);
      } else {
        ajaxToast('warning', res.data.message || 'Unexpected response.');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Login Failed";
      ajaxToast('error', errorMsg);
    }
  });
}


function togglePassword(fieldId, icon) {
  const input = document.getElementById(fieldId);

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "🙈";
  } else {
    input.type = "password";
    icon.textContent = "👁️";
  }
}