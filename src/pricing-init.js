const STORAGE_KEY = "vtw-billing-cycle";

const setActive = (btn, active) => {
  if (!btn) return;
  btn.classList.toggle("is-active", active);
  btn.setAttribute("aria-pressed", active ? "true" : "false");
};

const applyBilling = (mode) => {
  const deck = document.querySelector(".vt-pricing");
  if (!deck) return;
  deck.dataset.billing = mode;

  document.querySelectorAll(".vt-pricing .amount[data-monthly]").forEach((el) => {
    const monthly = el.getAttribute("data-monthly");
    const yearly = el.getAttribute("data-yearly");
    el.textContent = mode === "yearly" ? (yearly ?? monthly ?? "—") : (monthly ?? "—");
  });

  localStorage.setItem(STORAGE_KEY, mode);
};

document.addEventListener("DOMContentLoaded", () => {
  const monthlyBtn = document.getElementById("billing-monthly");
  const yearlyBtn = document.getElementById("billing-yearly");
  const compareBtn = document.getElementById("open-compare");
  const compareDialog = document.getElementById("compare-dialog");

  const stored = localStorage.getItem(STORAGE_KEY);
  const initial = stored === "yearly" ? "yearly" : "monthly";
  applyBilling(initial);
  setActive(monthlyBtn, initial === "monthly");
  setActive(yearlyBtn, initial === "yearly");

  monthlyBtn?.addEventListener("click", () => {
    applyBilling("monthly");
    setActive(monthlyBtn, true);
    setActive(yearlyBtn, false);
  });

  yearlyBtn?.addEventListener("click", () => {
    applyBilling("yearly");
    setActive(monthlyBtn, false);
    setActive(yearlyBtn, true);
  });

  compareBtn?.addEventListener("click", () => {
    if (!compareDialog) return;
    if (typeof compareDialog.showModal === "function") {
      compareDialog.showModal();
      return;
    }
    compareDialog.removeAttribute("open");
    compareDialog.setAttribute("open", "true");
  });
});
