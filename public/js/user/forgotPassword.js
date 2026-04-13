const form = document.getElementById("forgotForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = e.target.email.value;

    try {
      const res = await axios.post("/forgot-password", { email });

      if (res.data.success) {
        if(typeof showToast === 'function') {
          showToast('success', 'OTP sent effectively check your email.');
        }
        setTimeout(() => {
          window.location.href = "/otp";
        }, 1500);
      }
    } catch (err) {
      if(typeof showToast === 'function') {
        showToast('error', err.response?.data?.message || 'Failed to send OTP.');
      }
    }
  });
}