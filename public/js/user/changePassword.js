
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("reset-password-form");
  const newPass = document.getElementById("new-password");
  const confirmPass = document.getElementById("confirm-password");
  const submitBtn = document.getElementById("submit-btn");

  // ================= ERROR HANDLING =================

const showError = (key, msg) => {
  const errorEl = document.getElementById(`${key}-error`);
  const input = document.getElementById(`${key}-password`);

  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden"); // ✅ ONLY THIS
  }

  if (input) input.classList.add("error");
};

  const clearError = (key) => {
    const errorEl = document.getElementById(`${key}-error`);
    const input = document.getElementById(`${key}-password`);

    if (errorEl) {
      errorEl.textContent = ""; // ✅ IMPORTANT
      errorEl.classList.add("hidden");
    }

    if (input) input.classList.remove("error");
  };

  // ================= PASSWORD STRENGTH =================

  const strengthBar = document.getElementById("strength-bar");
  const strengthLbl = document.getElementById("strength-label");
  const reqList = document.getElementById("req-list");

  const checks = {
    length: { el: document.getElementById("req-length"), test: v => v.length >= 8 },
    upper: { el: document.getElementById("req-upper"), test: v => /[A-Z]/.test(v) },
    number: { el: document.getElementById("req-number"), test: v => /[0-9]/.test(v) },
    special: { el: document.getElementById("req-special"), test: v => /[^A-Za-z0-9]/.test(v) },
  };

  newPass.addEventListener("input", () => {
    clearError("new");

    const v = newPass.value;

    if (!v) {
      strengthBar.style.display = "none";
      strengthLbl.style.display = "none";
      reqList.style.display = "none";
      return;
    }

    strengthBar.style.display = "flex";
    strengthLbl.style.display = "block";
    reqList.style.display = "grid";

    let score = 0;

    for (const key in checks) {
      const ok = checks[key].test(v);

      checks[key].el.className = "req-item " + (ok ? "met" : "unmet");

      if (ok) score++;
    }

    const levels = [
      { cls: "active-weak", lbl: "Weak" },
      { cls: "active-fair", lbl: "Fair" },
      { cls: "active-good", lbl: "Good" },
      { cls: "active-strong", lbl: "Strong" }
    ];

    const lvl = levels[score - 1] || { cls: "", lbl: "" };

    [1, 2, 3, 4].forEach((n, i) => {
      const seg = document.getElementById("seg" + n);
      seg.className = "strength-seg" + (i < score ? " " + lvl.cls : "");
    });

    strengthLbl.textContent = "Strength: " + lvl.lbl;
  });

  // ================= MATCH CHECK =================

  const matchDot = document.getElementById("match-dot");

  confirmPass.addEventListener("input", () => {
    clearError("confirm");

    if (!confirmPass.value) {
      matchDot.className = "";
      return;
    }

    const match = confirmPass.value === newPass.value;

    matchDot.className = "show " + (match ? "ok" : "bad");
  });

  // ================= FORM SUBMIT =================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearError("new");
    clearError("confirm");

    // FRONTEND VALIDATION
    if (!newPass.value) {
      return showError("new", "Enter a new password");
    }

    if (newPass.value.length < 6) {
      return showError("new", "Minimum 6 characters required");
    }

    if (newPass.value !== confirmPass.value) {
      return showError("confirm", "Passwords do not match");
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = "Processing...";

    try {
      const res = await axios.post("/reset-password", {
        password: newPass.value,
        confirmPassword: confirmPass.value
      });

      if (res.data.success) {
        window.location.href = res.data.redirect || "/login";
      }

    } catch (err) {

      console.log("ERROR:", err.response?.data); // ✅ DEBUG

      const data = err.response?.data;

     const serverMsg =
  data?.message ||
  data?.errors?.password?.[0] ||
data?.errors?.confirmPassword?.[0]||
  "Server not responding";

      // 🔥 SMART FIELD MAPPING
      if (serverMsg.toLowerCase().includes("match")) {
        showError("confirm", serverMsg);
      } else {
        showError("new", serverMsg);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = "Update Password";
    }
  });

});

// ================= TOGGLE PASSWORD =================

window.togglePassword = function (id, btn) {
  const input = document.getElementById(id);

  const isPass = input.type === "password";

  input.type = isPass ? "text" : "password";

  btn.classList.toggle("text-black", isPass);
};