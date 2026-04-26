document.addEventListener("DOMContentLoaded", () => {

  const inputs = document.querySelectorAll(".otp-box");
  const otpContainer = document.getElementById("otpContainer");
  const resendBtn = document.getElementById("resendBtn");
  const timerEl = document.getElementById("timer");

  startTimer();

  // 🔹 INPUT HANDLING
  inputs.forEach((input, index) => {

    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, ""); // only numbers

      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }

      clearOtpError();
    });

    input.addEventListener("keydown", (e) => {

      // 🔙 BACKSPACE
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }

      // ⬅️➡️ ARROW NAVIGATION
      if (e.key === "ArrowLeft" && index > 0) {
        inputs[index - 1].focus();
      }

      if (e.key === "ArrowRight" && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });

  otpContainer.addEventListener("paste", (e) => {
    e.preventDefault();

    const paste = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "");

    if (!paste) return;

    const digits = paste.split("");

    inputs.forEach((input, i) => {
      input.value = digits[i] || "";
    });

    const lastIndex = Math.min(digits.length, inputs.length) - 1;
    if (lastIndex >= 0) inputs[lastIndex].focus();

    clearOtpError();

    // 🚀 AUTO VERIFY (optional)
    // if (digits.length === inputs.length) {
    //   verifyOtp();
    // }
  });

});


// 🔹 GET OTP
function getOtp() {
  return Array.from(document.querySelectorAll(".otp-box"))
    .map(input => input.value)
    .join("");
}


let interval = null;
let time = 60;

function startTimer() {
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  if (!timerEl || !resendBtn) return;

  time = 60;

  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  resendBtn.disabled = true;
  resendBtn.classList.add("opacity-50", "cursor-not-allowed");

  timerEl.textContent = `Resend code in ${time}s`;

  interval = setInterval(() => {
    time--;

    if (time >= 0) {
      timerEl.textContent = `Resend code in ${time}s`;
    }

    if (time <= 0) {
      clearInterval(interval);
      interval = null;

      timerEl.textContent = "Didn't receive code?";
      resendBtn.disabled = false;
      resendBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }

  }, 1000);
}

async function verifyOtp() {
  clearOtpError();

  const otp = getOtp();

  if (otp.length !== 6) {
    showOtpError("Enter complete OTP");
    return;
  }

  try {
    const res = await axios.post("/verify-otp", { otp });

    if (res.data.success) {
      window.location.href = res.data.redirect;
      ajaxToast("success","Otp Verified")
    }

  } catch (err) {
    const error = err.response?.data;

    if (error?.errors?.otp) {
      showOtpError(error.errors.otp[0]);
    } else {
      showOtpError("Invalid OTP");
    }
  }
}


function showOtpError(message) {
  const el = document.getElementById("otpError");
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearOtpError() {
  const el = document.getElementById("otpError");
  el.classList.add("hidden");
}



async function resendOtp() {
  try {
    const res = await axios.post("/resend-otp");

    if (res.data.success) {
      if (typeof showToast === "function") {
        ajaxToast("success", res.data.message || "OTP resent successfully");
      }
      startTimer();
    } else {
      if (typeof showToast === "function") {
        ajaxToast("error", res.data.message || "Failed to resend OTP");
      }
    }

  } catch (err) {
    if (typeof showToast === "function") {
      ajaxToast("error", err.response?.data?.message || "Resending OTP failed");
    }
  }
}