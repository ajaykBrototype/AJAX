document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("change-password-form");
  if (!form) return;

  const currentPass = document.getElementById("current-password");
  const newPass     = document.getElementById("new-password");
  const confirmPass = document.getElementById("confirm-password");
  const submitBtn   = document.getElementById("submit-btn");

  const errors = {
    current: document.getElementById("current-error"),
    new:     document.getElementById("new-error"),
    confirm: document.getElementById("confirm-error")
  };

  // ─── UTILS ───
  const showError = (key, msg) => {
    if (errors[key]) {
      errors[key].textContent = msg;
      errors[key].classList.add("show");
    }
    const input = document.getElementById(`${key}-password`);
    if (input) input.classList.add("error");
  };

  const clearError = (key) => {
    if (errors[key]) {
      errors[key].classList.remove("show");
    }
    const input = document.getElementById(`${key}-password`);
    if (input) input.classList.remove("error");
  };

  const clearAllErrors = () => {
    Object.keys(errors).forEach(clearError);
  };

  // ─── PASSWORD STRENGTH (Logic moved from EJS) ───
  const strengthBar = document.getElementById("strength-bar");
  const strengthLbl = document.getElementById("strength-label");
  const reqList     = document.getElementById("req-list");
  const segs        = [1, 2, 3, 4].map(i => document.getElementById("seg" + i));

  const checks = {
    length:  { el: document.getElementById("req-length"),  test: v => v.length >= 8 },
    upper:   { el: document.getElementById("req-upper"),   test: v => /[A-Z]/.test(v) },
    number:  { el: document.getElementById("req-number"),  test: v => /[0-9]/.test(v) },
    special: { el: document.getElementById("req-special"), test: v => /[^A-Za-z0-9]/.test(v) },
  };

  const CHECK_SVG   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
  const UNCHECK_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const levels = [
    { cls: "active-weak",   label: "Weak",   active: 1 },
    { cls: "active-fair",   label: "Fair",   active: 2 },
    { cls: "active-good",   label: "Good",   active: 3 },
    { cls: "active-strong", label: "Strong", active: 4 },
  ];
  const labelColors = { Weak: "#B04040", Fair: "#C47A2A", Good: "#5B8A4A", Strong: "#3A7D44" };

  newPass.addEventListener("input", () => {
    clearError("new");
    const v = newPass.value;
    if (!v) {
      strengthBar.style.display = "none";
      strengthLbl.style.display = "none";
      reqList.style.display = "none";
      segs.forEach(s => s.className = "strength-seg");
      return;
    }
    strengthBar.style.display = "flex";
    strengthLbl.style.display = "block";
    reqList.style.display     = "flex";

    let score = 0;
    for (const key in checks) {
      const ok = checks[key].test(v);
      const txt = checks[key].el.textContent.trim();
      checks[key].el.className = "req-item " + (ok ? "met" : "unmet");
      checks[key].el.innerHTML = (ok ? CHECK_SVG : UNCHECK_SVG) + " " + txt;
      if (ok) score++;
    }
    const lvl = levels[score - 1] || { cls: "active-weak", label: "Weak", active: 0 };
    segs.forEach((s, i) => {
      s.className = "strength-seg" + (i < lvl.active ? " " + lvl.cls : "");
    });
    strengthLbl.textContent = score === 0 ? "" : "Strength: " + lvl.label;
    strengthLbl.style.color = labelColors[lvl.label] || "var(--stone)";
  });

  // ─── CONFIRM MATCH ───
  const matchDot = document.getElementById("match-dot");
  confirmPass.addEventListener("input", () => {
    clearError("confirm");
    if (!confirmPass.value) {
      matchDot.classList.remove("show", "ok", "bad");
      return;
    }
    const match = confirmPass.value === newPass.value;
    matchDot.classList.toggle("show", true);
    matchDot.classList.toggle("ok",  match);
    matchDot.classList.toggle("bad", !match);
  });

  currentPass.addEventListener("input", () => clearError("current"));

  // ─── SUBMISSION ───
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;

    // 1. Basic Empty Validation
    if (!currentPass.value.trim()) {
      showError("current", "Please enter your current password.");
      hasError = true;
    }
    if (!newPass.value.trim()) {
      showError("new", "Please enter a new password.");
      hasError = true;
    }
    if (!confirmPass.value.trim()) {
      showError("confirm", "Please confirm your new password.");
      hasError = true;
    }

    if (hasError) return;

    // 2. Strength & Match Validation
    if (document.querySelectorAll(".unmet").length > 0) {
      showError("new", "Please meet all password requirements.");
      return;
    }
    if (newPass.value !== confirmPass.value) {
      showError("confirm", "Passwords do not match.");
      return;
    }

    // 3. API Call
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Saving...
    `;
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";

    try {
      const res = await axios.post("/change-password", {
        currentPassword: currentPass.value,
        newPassword: newPass.value,
        confirmPassword: confirmPass.value
      });

      if (res.data.success) {
        submitBtn.innerHTML = "Saved";
        if (typeof showToast === "function") {
          ajaxToast("success", "Password updated successfully.");
        }
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1500);
      }
    } catch (err) {
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";

      const data = err.response?.data;
      if (data && data.errors) {
        // Handle specific server-side errors inline
        if (data.errors.currentPassword) showError("current", data.errors.currentPassword[0]);
        if (data.errors.newPassword)     showError("new",     data.errors.newPassword[0]);
        if (data.errors.confirmPassword) showError("confirm", data.errors.confirmPassword[0]);
      } else {
        if (typeof showToast === "function") {
          showToast("error", data?.message || "An error occurred. Please try again.");
        }
      }
    }
  });

  // Spin keyframe (ensure it exists)
  if (!document.getElementById("spin-style")) {
    const style = document.createElement("style");
    style.id = "spin-style";
    style.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }
});

