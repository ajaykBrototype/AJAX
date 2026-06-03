const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("previewImage");

// IMAGE PREVIEW
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file) {
    if (!file.type.startsWith("image/")) {
      return ajaxToast("error", "Only images allowed");
    }

    preview.src = URL.createObjectURL(file);
  }
});

// REMOVE IMAGE
function removeImage() {
  preview.src = "https://via.placeholder.com/150";
  imageInput.value = "";
}

// FORM SUBMIT
document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const btn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const loader = document.getElementById("btnLoader");

  const formData = new FormData(this);

  // CLEAR PREVIOUS ERRORS
  document.querySelectorAll('[id^="error-"]').forEach(el => {
    el.classList.add('hidden');
    el.innerText = '';
  });

  const showInlineError = (field, msg) => {
    const el = document.getElementById('error-' + field);
    if (el) {
      el.innerText = msg;
      el.classList.remove('hidden');
    } else {
      ajaxToast('error', msg); // Fallback
    }
  };

  // VALIDATION
  const phone = formData.get("phone");
  const phoneRegex = /^[0-9]{10}$/;
  
  if (phone && !phoneRegex.test(phone)) {
    return showInlineError("phone", "Phone number must be exactly 10 digits");
  }

  // LOADING UI
  btn.disabled = true;
  btnText.innerText = "Saving...";
  loader.classList.remove("hidden");

  try {
    const res = await axios.patch("/profile/update", formData);

    console.log("🔥 RESPONSE:", res.data);

    // OTP FLOW
   if (res.data.requireOtp) {
  try {
    ajaxToast("success", res.data.message);
  } catch (e) {
    console.log("Toast failed", e);
  }

  window.location.href = "/profile/email/verify";
  return;
}

    // ERROR
    if (!res.data.success) {
      if (res.data.field) {
        return showInlineError(res.data.field, res.data.message);
      }
      return showInlineError('name', res.data.message || "Update failed"); // Default to an inline position or fallback
    }

    // SUCCESS
    ajaxToast("success", res.data.message || "Profile updated");

    setTimeout(() => {
      window.location.href = "/profile";
    }, 1000);

  } catch (err) {
    console.log("ERROR:", err);

    ajaxToast(
      "error",
      err.response?.data?.message || "Something went wrong"
    );
  } finally {
    btn.disabled = false;
    btnText.innerText = "Save Changes →";
    loader.classList.add("hidden");
  }
});