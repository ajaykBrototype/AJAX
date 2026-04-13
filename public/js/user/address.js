window.onload = function () {
  console.log("JS LOADED 🔥");

  const form = document.getElementById("addAddressForm");

  console.log("FORM:", form);

  if (!form) return;

  form.onsubmit = async function (e) {
    e.preventDefault();

    console.log("SUBMIT CALLED ✅");

    const data = Object.fromEntries(new FormData(form));

    console.log("SENDING:", data);

    try {
      const res = await axios.post("/address/add", data);

      console.log("RESPONSE:", res.data);

      if (res.data.success) {
        if(typeof showToast === 'function') {
          showToast('success', 'Address saved successfully.');
        }
        setTimeout(() => {
          window.location.href = "/address";
        }, 1500);
      }

    } catch (err) {
      console.log("ERROR:", err.response?.data);
      if(typeof showToast === 'function') {
        showToast('error', err.response?.data?.message || 'Error saving address');
      }
    }
  };
};