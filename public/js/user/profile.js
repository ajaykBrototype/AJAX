const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("previewImage");

// 🔥 IMAGE PREVIEW
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
  }
});

// 🔥 REMOVE IMAGE
function removeImage() {
  preview.src = "https://via.placeholder.com/150";
}

// 🔥 FORM SUBMIT
document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const form = this;
  const btn = document.getElementById("submitBtn");      // 🔥 use id
  const btnText = document.getElementById("btnText");    // 🔥 text span
  const loader = document.getElementById("btnLoader");   // 🔥 spinner

  const formData = new FormData(form);

  // 🔥 SHOW SPINNER
  btn.disabled = true;
  btnText.innerText = "Saving...";
  loader.classList.remove("hidden");

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
      }, 2000);
    }

  } catch (err) {
    showToast("error", err.response?.data?.message || "Something went wrong");
  } finally {
    // 🔥 HIDE SPINNER
    btn.disabled = false;
    btnText.innerText = "Save Changes →";
    loader.classList.add("hidden");
  }
});