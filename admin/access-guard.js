// Admin access validation script
(function () {
  // Check if access is validated
  if (sessionStorage.getItem("adminAccessValidated") !== "true") {
    window.location.href = "/admin/access.html";
    return;
  }

  // Check if authenticated (signed admin cookie) before allowing access to admin pages.
  // This is a UX guard; server-side endpoints still enforce auth.
  fetch("/api/config/status", { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error("unauthorized");
    })
    .catch(() => {
      window.location.href = "/admin/login.html";
    });
})();
