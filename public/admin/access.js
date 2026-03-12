const form = document.getElementById("vtw-admin-auth-form");
const input = document.getElementById("accessCode");
const submit = document.getElementById("vtw-admin-auth-submit");
const status = document.getElementById("vtw-admin-auth-status");
const redirectTarget = "/admin/mission";

const setStatus = (message, tone = "") => {
  if (!status) return;
  status.textContent = message || "";
  status.className = `vtw-admin-auth__status${tone ? ` is-${tone}` : ""}`;
};

const checkExistingSession = async () => {
  try {
    const response = await fetch("/api/config/status", {
      credentials: "include",
      cache: "no-store",
    });
    if (response.ok) {
      window.location.replace(redirectTarget);
    }
  } catch (_) {
    // Keep the access page interactive even if the session probe fails.
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const accessCode = String(input?.value || "").trim();
  if (!accessCode) {
    setStatus("Enter your admin access code.", "error");
    input?.focus();
    return;
  }

  if (submit) submit.disabled = true;
  setStatus("Signing in...");

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accessCode }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Access denied.");
    }

    setStatus("Access granted. Opening dashboard...", "success");
    window.setTimeout(() => {
      window.location.replace(redirectTarget);
    }, 220);
  } catch (error) {
    setStatus(error?.message || "Access denied.", "error");
    if (submit) submit.disabled = false;
  }
};

if (form && input && submit && status) {
  form.addEventListener("submit", handleSubmit);
  checkExistingSession();
}
