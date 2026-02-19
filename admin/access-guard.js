// Admin access guard (UX). Server-side routes still enforce auth.
(function () {
  try {
    document.documentElement.classList.add("admin-auth-pending");
  } catch (_) {}

  const redirectToAccess = () => {
    window.location.replace("/admin/access.html");
  };

  fetch("/api/config/status", { credentials: "include", cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("unauthorized");
      try {
        document.documentElement.classList.remove("admin-auth-pending");
      } catch (_) {}
    })
    .catch(() => redirectToAccess());
})();
