const SUBSCRIBERS_KEY = "vtw-status-subscribers";

const isValidEmail = (value) => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const loadSubscribers = () => {
  try {
    return JSON.parse(localStorage.getItem(SUBSCRIBERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveSubscribers = (list) => {
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(list.slice(0, 100)));
};

document.addEventListener("DOMContentLoaded", () => {
  const updatedEl = document.getElementById("status-updated");
  const emailEl = document.getElementById("statusEmail");
  const subscribeBtn = document.getElementById("statusSubscribe");
  const statusEl = document.getElementById("statusSubscribeStatus");

  if (updatedEl) {
    const now = new Date();
    updatedEl.textContent = `Updated: ${now.toISOString().replace("T", " ").slice(0, 19)} UTC`;
  }

  subscribeBtn?.addEventListener("click", () => {
    const email = (emailEl?.value || "").trim();
    if (!isValidEmail(email)) {
      if (statusEl) statusEl.textContent = "Enter a valid email.";
      return;
    }
    const list = loadSubscribers();
    if (!list.includes(email)) list.unshift(email);
    saveSubscribers(list);
    if (statusEl) statusEl.textContent = "Subscribed (stored locally).";
    if (emailEl) emailEl.value = "";
  });
});
