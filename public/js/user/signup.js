
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("signupForm");

   document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      const errorEl = document.getElementById(input.name + "Error");

      if (errorEl) {
        errorEl.classList.add("hidden");
        input.classList.remove("border-red-500");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    const data = Object.fromEntries(new FormData(form));
         let hasError = false;
  if (!data.name.trim()) { showError("nameError", "Name is required"); hasError = true; }
  if (!data.email.trim()) { showError("emailError", "Email is required"); hasError = true; }
  if (!data.password) { showError("passwordError", "Password is required"); hasError = true; }
  if (!data.confirmPassword) { showError("confirmPasswordError", "Confirm Password is required"); hasError = true; }
  
  if (hasError) return;
    try {
      const res = await axios.post("/signup", data);

      ajaxToast('success', res.data.message || 'Account created successfully!');
      setTimeout(() => {
        window.location.href = res.data.redirect || '/';
      }, 1500);

    } catch (err) {
  const error = err.response?.data;

  // ✅ FIELD ERRORS (priority)
  if (error?.errors) {
    for (let key in error.errors) {
      ajaxError(key + "Error", error.errors[key][0]);
    }
    return; // 🚨 stop here (no Swal)
  }


  const fallbackMsg = error?.message || err.message || "Registration failed. Please try again.";
  ajaxToast('error', fallbackMsg);
}
  });

});


function showError(id, message) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = message;
    el.classList.remove("hidden");

    const input = el.previousElementSibling;
    input.classList.add("border-red-500");
  }
}

function clearErrors() {
  document.querySelectorAll("p[id$='Error']").forEach(el => {
    el.textContent = "";
    el.classList.add("hidden");

    const input = el.previousElementSibling;
    input.classList.remove("border-red-500");
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