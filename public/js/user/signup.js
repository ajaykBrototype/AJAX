
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
    const btn = document.getElementById("signupBtn");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    const data = Object.fromEntries(new FormData(form));
         let hasError = false;

if (!data.name.trim()) {
  showError("nameError", "Name is required");
  hasError = true;
} else if (!/^[A-Za-z ]+$/.test(data.name.trim())) {
  showError(
    "nameError",
    "Name should contain only letters"
  );
  hasError = true;
} else if (data.name.trim().length < 3) {
  showError(
    "nameError",
    "Name must be at least 3 characters"
  );
  hasError = true;
}

if (!data.email.trim()) {
  showError("emailError", "Email is required");
  hasError = true;
} else if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
) {
  showError(
    "emailError",
    "Enter a valid email address"
  );
  hasError = true;
}
  if (!data.password) {
  showError("passwordError", "Password is required");
  hasError = true;
} else {

  if (data.password.length < 6) {
    showError(
      "passwordError",
      "Password must be at least 6 characters"
    );
    hasError = true;
  }

  if (!/[A-Z]/.test(data.password)) {
    showError(
      "passwordError",
      "Password must contain at least one uppercase letter"
    );
    hasError = true;
  }

  if (!/[a-z]/.test(data.password)) {
    showError(
      "passwordError",
      "Password must contain at least one lowercase letter"
    );
    hasError = true;
  }

  if (!/[0-9]/.test(data.password)) {
    showError(
      "passwordError",
      "Password must contain at least one number"
    );
    hasError = true;
  }

  if (!/[^A-Za-z0-9]/.test(data.password)) {
    showError(
      "passwordError",
      "Password must contain at least one special character"
    );
    hasError = true;
  }
}

if (!data.confirmPassword) {
  showError(
    "confirmPasswordError",
    "Confirm Password is required"
  );
  hasError = true;
}

if (
  data.password &&
  data.confirmPassword &&
  data.password !== data.confirmPassword
) {
  showError(
    "confirmPasswordError",
    "Passwords do not match"
  );
  hasError = true;
}
  
  if (hasError) return;

  if (btn) {
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-not-allowed");
    if (btnText) btnText.textContent = "Creating...";
    if (btnSpinner) btnSpinner.classList.remove("hidden");
  }

    try {
      const res = await axios.post("/signup", data);

      ajaxToast('success', res.data.message || 'Account created successfully!');
      setTimeout(() => {
        window.location.href = res.data.redirect || '/';
      }, 1500);

    } catch (err) {
  
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("opacity-70", "cursor-not-allowed");
        if (btnText) btnText.textContent = "Create Account";
        if (btnSpinner) btnSpinner.classList.add("hidden");
      }

  const error = err.response?.data;


  if (error?.errors) {
    for (let key in error.errors) {
      showError(key + "Error", error.errors[key][0]);
    }
    return; // 
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


const referralToggle = document.getElementById("referralToggle");
const referralWrapper = document.getElementById("referralWrapper");
const toggleCircle = document.getElementById("toggleCircle");

let referralEnabled = false;

referralToggle.addEventListener("click", () => {

  referralEnabled = !referralEnabled;

  if (referralEnabled) {

    referralToggle.classList.remove("bg-[#2B1A10]");
    referralToggle.classList.add("bg-[#4A3425]");

    toggleCircle.classList.add("translate-x-6");

    referralWrapper.classList.remove("hidden");

    setTimeout(() => {
      referralWrapper.classList.remove("opacity-0", "translate-y-2");
    }, 10);

  } else {

    referralToggle.classList.remove("bg-[#4A3425]");
    referralToggle.classList.add("bg-[#2B1A10]");

    toggleCircle.classList.remove("translate-x-6");

    referralWrapper.classList.add("opacity-0", "translate-y-2");

    setTimeout(() => {
      referralWrapper.classList.add("hidden");
    }, 300);

  }

});

// Auto-populate referral code from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');

if (refCode) {
  const referralInput = document.querySelector('input[name="referralCode"]');
  if (referralInput) {
    referralInput.value = refCode;
    
    // Trigger the toggle to show the referral input field if it's not already enabled
    if (typeof referralEnabled !== 'undefined' && !referralEnabled) {
      if (referralToggle) referralToggle.click();
    }
  }
}
