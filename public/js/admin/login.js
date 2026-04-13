document.getElementById("adminLoginForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  console.log("FORM SUBMITTED ✅"); // 👈 VERY IMPORTANT

  const formData = new FormData(e.target);

  const data = {
    email: formData.get("email"),
    password: formData.get("password")
  };

try {
  const res = await axios.post("/admin/login", data);
  window.location.href = res.data.redirect;

} catch (err) {
  const errors = err.response?.data?.errors;

  // clear old
  emailError.innerText = "";
  passwordError.innerText = "";

  if (errors?.email) {
    emailError.innerText = errors.email[0];
  }

  if (errors?.password) {
    passwordError.innerText = errors.password[0];
  }

  if (errors?.general) {
    alert(errors.general[0]);
  }
}

});