    const imageInput = document.getElementById("imageInput");
    const preview = document.getElementById("previewImage");

    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    });

    function removeImage() {
      preview.src = "/images/default-user.png";
    }

    // FORM SUBMIT
document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const form = this;
  const btn = form.querySelector('button');
  const formData = new FormData(form);

  btn.innerText = "Saving...";
  btn.disabled = true;

  try {
    const res = await axios.post("/profile/update", formData);

    if (res.data.requireOtp) {
      showToast("success", "OTP sent to your email");

      setTimeout(() => {
        window.location.href = "/profile/email/verify";
      }, 1200);

      return;
    }

    if (res.data.success) {
      showToast("success", "Profile updated");

      setTimeout(() => {
        window.location.href = "/profile";
      }, 1200);
    }

  } catch (err) {
    showToast("error", err.response?.data?.message || "Something went wrong");
  } finally {
    btn.innerText = "Save Changes";
    btn.disabled = false;
  }
});