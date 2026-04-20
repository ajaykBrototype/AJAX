window.openSubModal=function(){
  document.getElementById("subCategoryId").value="";
   document.getElementById("subCategoryName").value = "";
  document.getElementById("parentCategory").value = "";
  document.getElementById("subCategoryStatus").checked = true;

  document.getElementById("subModalTitle").innerText="Add SubCategory";

  const modal=document.getElementById("subCategoryModal");
  const content = document.getElementById("subModalContent");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

    setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);
}

  window.closeSubModal = function () {
  const modal = document.getElementById("subCategoryModal");
  const content = document.getElementById("subModalContent");

  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 200);
}

window.saveSubCategory = async function () {
  const name = document.getElementById("subCategoryName").value.trim();
  const categoryId = document.getElementById("parentCategory").value;
  const isActive = document.getElementById("subCategoryStatus").checked;

  try{

    const res=await axios.post("/admin/subcategories/add",{
        name,
        categoryId,
        isActive
    });
    if(res.data.success){
        closeSubModal();
        location.reload();
    }
  }catch (err) {
  console.log("ERROR:", err.response?.data || err.message);
  alert(err.response?.data?.message || "Error");
}
};