const autoToggle = document.getElementById("autonomous-mode");
const applyBtn = document.getElementById("apply");
const planConfirm = document.getElementById("plan-confirm");
const responseEl = document.getElementById("response");
const planSummary = document.getElementById("plan-summary");

if (autoToggle) autoToggle.checked = true;

const hasPlanSignal = () => {
  const summary = (planSummary?.textContent || "").trim();
  if (summary) return true;
  const responseText = (responseEl?.textContent || "").trim();
  return responseText.includes('"plan"') || responseText.includes("Plan ready");
};

const maybeAutoApply = () => {
  if (!autoToggle?.checked) return;
  if (!hasPlanSignal()) return;
  if (planConfirm) planConfirm.value = "ship it";
  if (applyBtn) {
    applyBtn.disabled = false;
    applyBtn.click();
  }
};

const observer = new MutationObserver(() => {
  maybeAutoApply();
});

if (responseEl) observer.observe(responseEl, { childList: true, subtree: true, characterData: true });
if (planSummary) observer.observe(planSummary, { childList: true, subtree: true, characterData: true });

// Fallback polling in case mutation misses async updates.
setInterval(maybeAutoApply, 1500);
