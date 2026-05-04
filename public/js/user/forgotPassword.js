const form = document.getElementById("forgotForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = e.target.email.value;

    try {
      const res = await axios.post("/forgot-password", { email });

      if (res.data.success) {
        if(typeof ajaxToast === 'function') {
          ajaxToast('success', 'OTP sent effectively check your email.');
        }
        setTimeout(() => {
          window.location.href = "/otp";
        }, 1500);
      }
    } catch (err) {
      if(typeof ajaxToast === 'function') {
        ajaxToast('error', err.response?.data?.message || 'Failed to send OTP.');
      }
    }
  });
}