const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 

    const data = Object.fromEntries(new FormData(e.target));

    try {
      const res = await axios.post("/login", data);

      if (res.data.success) {
        showToast('success', res.data.message || 'Login successful!');
        setTimeout(() => {
          window.location.href = res.data.redirect || '/';
        }, 1500);
      } else {
        showToast('warning', res.data.message || 'Unexpected response.');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Login Failed";
      showToast('error', errorMsg);
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