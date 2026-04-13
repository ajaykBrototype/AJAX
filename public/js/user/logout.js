document.addEventListener("DOMContentLoaded", () => {

  const buttons = [
    document.getElementById("logoutBtnSidebar"),
    document.getElementById("logoutBtnHeader")
  ];

  buttons.forEach(btn => {
    if (!btn) return;

    btn.addEventListener("click", async () => {
      console.log("CLICKED 🔥");

      try {
        await axios.get("/logout");


          showToast('success', 'Logged out successfully. See you soon!');
        
        
        setTimeout(() => {
         
          window.location.href = "/login";
        }, 1200);

      } catch (err) {
        console.log("Logout error:", err);
        // Fallback redirection
        window.location.href = "/login";
      }
    });
  });

});