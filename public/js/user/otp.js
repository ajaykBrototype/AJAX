document.addEventListener("DOMContentLoaded", () => {

  const inputs = document.querySelectorAll(".otp-box");
  const resendBtn = document.getElementById("resendBtn");
  const timerEl = document.getElementById("timer");

  startTimer(); // ✅ start timer on load

  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
      clearOtpError();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });

});

// 🔹 get OTP
function getOtp() {
  return Array.from(document.querySelectorAll(".otp-box"))
    .map(input => input.value)
    .join("");
}
let interval; // global so we can reset it

function startTimer() {
  let time = 30;

  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  if (!timerEl || !resendBtn) return;

  resendBtn.disabled = true;
  timerEl.textContent = `Resend code in ${time}s`;

  clearInterval(interval); // ✅ stop old timer if exists

  interval = setInterval(() => {
    time--;

    timerEl.textContent = `Resend code in ${time}s`;

    if (time <= 0) {
      clearInterval(interval);
      timerEl.textContent = "You can resend now";
      resendBtn.disabled = false;
    }
  }, 1000);
}

// 🔹 verify
const verifyOtp = async function () {
  clearOtpError();

  const otp = getOtp();
  console.log("OTP:", otp);

  try {
    const res = await axios.post("/verify-otp", { otp });

    console.log("SUCCESS:", res.data);

    if (res.data.success) {
      window.location.href = res.data.redirect;
    }

  } catch (err) {
    console.log(err.response?.data);

    const error = err.response?.data;

    if (error?.errors?.otp) {
      showOtpError(error.errors.otp[0]);
    }
  }
};

function showOtpError(message) {
  const el = document.getElementById("otpError");
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearOtpError() {
  const el = document.getElementById("otpError");
  el.classList.add("hidden");
}

// 🔹 resend
async function resendOtp() {
  try{
    const res=await axios.post("/resend-otp");

    console.log("RES:",res.data);
    if(res.data.success){
      if(typeof showToast === 'function') {
        showToast('success', 'OTP resent successfully.');
      }
      startTimer();
    }
  }catch(err){
    console.log("ERROR:", err.response?.data || err.message); 
    if(typeof showToast === 'function') {
      showToast('error', 'Resending OTP failed.');
    }
  }
}