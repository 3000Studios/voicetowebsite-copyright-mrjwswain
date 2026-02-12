// Admin access validation script
(function () {
  // Check if access is validated
  if (sessionStorage.getItem("adminAccessValidated") !== "true") {
    window.location.href = "/admin/access.html";
    return;
  }
})();
