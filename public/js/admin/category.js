window.openModal = function () {
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryName").value = "";
  document.getElementById("categoryStatus").checked = true;

  document.getElementById("modalTitle").innerText = "Add Category";

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
window.openEditModal = function (id, name, isActive) {
  console.log("EDIT ID:", id);

  const modal = document.getElementById("categoryModal");
  const content = document.getElementById("modalContent");

  document.getElementById("categoryId").value = id;
  document.getElementById("categoryName").value = name;
  document.getElementById("categoryStatus").checked = (isActive === true || isActive === "true");

  document.getElementById("modalTitle").innerText = "Edit Category";

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
};

window.saveCategory = async function () {
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("categoryName").value.trim();
  const isActive = document.getElementById("categoryStatus").checked;

     console.log("ID:", id);
  if (!name) {
    alert("Category name required");
    return;
  }

  try {
    let res;

     if (id && id !== "") {
      res = await axios.patch(`/admin/categories/${id}`, {
        name,
        isActive
      });
    } else {
      res = await axios.post("/admin/categories/add", {
        name,
        isActive
      });
    }

    if (res.data.success) {
      closeModal();
      location.reload();
    }

  } catch (err) {
    alert(err.response?.data?.message || "Error");
  }
};

window.deleteCategory = async function (id) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  try {
    const res = await axios.delete(`/admin/categories/${id}`);

    if (res.data.success) {
      location.reload();
    }

  } catch (err) {
    alert("Delete failed");
  }
};
window.toggleCategory = async function (id, el) {
  try {
    const res = await axios.patch(`/admin/categories/toggle/${id}`);

    if (res.data.success) {

      el.classList.toggle("active");

      const pill = el.closest("tr").querySelector(".status-pill");

      if (el.classList.contains("active")) {
        pill.textContent = "Active";
        pill.className = "status-pill status-active";
      } else {
        pill.textContent = "Inactive";
        pill.className = "status-pill status-inactive";
      }

    }

  } catch (err) {
    alert("Toggle failed");
  }
};