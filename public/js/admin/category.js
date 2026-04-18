window.openModal = function () {
  const modal = document.getElementById("categoryModal");
  const content = document.getElementById("modalContent");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
};

window.closeModal = function () {
  const modal = document.getElementById("categoryModal");
  const content = document.getElementById("modalContent");

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");

     document.getElementById("categoryName").value = "";
  document.getElementById("categoryStatus").checked = true;
  }, 200);
  modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});
};


window.saveCategory = async function () {
  console.log("🔥 SAVE CLICKED");

  const name = document.getElementById("categoryName").value.trim();
  const isActive = document.getElementById("categoryStatus").checked;

  if (!name) {
    alert("Category name required");
    return;
  }

  try {
    const res = await axios.post("/admin/categories/add", {
      name,
      isActive
    });

    console.log("SUCCESS:", res.data);

    if (res.data.success) {
      closeModal();
      location.reload();
    }

  } catch (err) {
    console.log("ERROR:", err.response);
    alert(err.response?.data?.message || "Error");
  }
};