    const imageInput = document.getElementById("imageInput");
    const preview = document.getElementById("previewImage");

    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    });

    function removeImage() {
      preview.src = "/images/default-user.png";
    }

    // FORM SUBMIT
   document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const fileInput = document.getElementById("imageInput");

  if (fileInput.files[0]) {
    formData.append("profileImage", fileInput.files[0]);
  }

  try {
    const res = await axios.post("/profile/update", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (res.data.success) {
      if(typeof showToast === 'function') {
        showToast('success', 'Profile updated successfully.');
      }
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
    }

  } catch (err) {
    console.log(err.response?.data || err.message);
    if(typeof showToast === 'function') {
      showToast('error', 'Update failed.');
    }
  }
});
