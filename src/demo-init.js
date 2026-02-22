const STORAGE_KEY = "vtw-demo-state";
const SAVED_BUILDS_KEY = "vtw-demo-builds";

const COMMANDS = [
  "Create a landing page for a barber shop with booking and pricing",
  "Build a creator portfolio with a reel section and email capture",
  "Make an agency homepage with services, case studies, and a contact form",
  "Design an ecommerce storefront for skincare with bundles and FAQs",
  "Create a WordPress migration landing page with SEO checklist and pricing",
];

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const getEls = () => ({
  steps: Array.from(document.querySelectorAll(".demo-step")),
  panels: Array.from(document.querySelectorAll(".demo-panel")),
  prompt: document.getElementById("demoPrompt"),
  email: document.getElementById("demoEmail"),
  micBtn: document.getElementById("demoMic"),
  micStatus: document.getElementById("demoMicStatus"),
  saveBtn: document.getElementById("demoSave"),
  saveStatus: document.getElementById("demoSaveStatus"),
  previewTitle: document.getElementById("previewTitle"),
  previewList: document.getElementById("previewList"),
  previewNext: document.getElementById("previewNext"),
  livePreviewStatus: document.getElementById("livePreviewStatus"),
  livePreviewLink: document.getElementById("livePreviewLink"),
  livePreviewFrame: document.getElementById("livePreviewFrame"),
  stylePackList: document.getElementById("stylePackList"),
  stylePackStatus: document.getElementById("stylePackStatus"),
  saveLinks: document.getElementById("demoSaveLinks"),
  gallery: document.getElementById("commandGallery"),
});

const defaultState = () => ({
  step: 1,
  siteType: "creator",
  prompt: "",
  theme: "midnight",
  stylePackIds: [],
  generatedSiteId: "",
  generatedPreviewUrl: "",
  generatedLayout: null,
});

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  const parsed = safeJsonParse(raw, null);
  if (!parsed) return defaultState();
  return { ...defaultState(), ...parsed };
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("vtw-theme", theme);
  } catch {}
};

const hasKeyword = (text, keyword) =>
  (text || "").toLowerCase().includes(keyword.toLowerCase());

const generateOutline = ({ siteType, prompt }) => {
  const normalizedPrompt = (prompt || "").trim();
  const titleBase =
    siteType === "creator"
      ? "Creator Portfolio"
      : siteType === "agency"
        ? "Agency Landing Page"
        : siteType === "local"
          ? "Local Service Website"
          : siteType === "ecommerce"
            ? "Ecommerce Storefront"
            : "Website";

  const title = normalizedPrompt
    ? `${titleBase}: ${normalizedPrompt.slice(0, 60)}${normalizedPrompt.length > 60 ? "…" : ""}`
    : titleBase;

  const sections = [
    "Hero (keyword-first headline + primary CTA)",
    "How it works (5-step flow)",
    "Use cases (tabs)",
    "Feature blocks (cards)",
    "Social proof (logos + metrics)",
    "Pricing preview (tiers + yearly toggle)",
    "FAQ (accordion + schema)",
    "Footer (Trust + Status + Partners)",
  ];

  if (siteType === "creator") sections.splice(2, 0, "Reel / highlights grid");
  if (siteType === "agency")
    sections.splice(2, 0, "Case studies (before/after)");
  if (siteType === "local") sections.splice(2, 0, "Booking + hours + location");
  if (siteType === "ecommerce")
    sections.splice(2, 0, "Featured products + bundles");

  if (
    hasKeyword(normalizedPrompt, "pricing") &&
    !sections.includes("Pricing")
  ) {
    sections.splice(5, 0, "Pricing (plans + add-ons)");
  }
  if (
    hasKeyword(normalizedPrompt, "booking") &&
    !sections.join(" ").includes("Booking")
  ) {
    sections.splice(3, 0, "Booking (calendar + form)");
  }
  if (hasKeyword(normalizedPrompt, "blog"))
    sections.splice(6, 0, "Blog hub (topic clusters)");

  return { title, sections };
};

const toAbsoluteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, window.location.origin).toString();
  } catch {
    return "";
  }
};

const renderSaveLinks = (els, items = []) => {
  if (!els.saveLinks) return;
  els.saveLinks.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = item.label;
    li.appendChild(a);
    els.saveLinks.appendChild(li);
  });
};

const renderStylePackChoices = (els, state, packs) => {
  if (!els.stylePackList) return;
  els.stylePackList.innerHTML = "";
  packs.forEach((pack) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-card";
    btn.dataset.stylePack = pack.id;
    btn.innerHTML = `<strong>${pack.name}</strong><br /><span class="muted">${pack.category}</span>`;
    btn.classList.toggle("is-selected", state.stylePackIds.includes(pack.id));
    els.stylePackList.appendChild(btn);
  });
  if (els.stylePackStatus) {
    els.stylePackStatus.textContent = state.stylePackIds.length
      ? `${state.stylePackIds.length} style libraries selected.`
      : "No style packs selected yet.";
  }
};

const fetchStylePacks = async (els, state) => {
  if (!els.stylePackList) return [];
  try {
    const res = await fetch("/api/style-packs");
    const data = await res.json().catch(() => ({}));
    const packs = Array.isArray(data?.stylePacks) ? data.stylePacks : [];
    renderStylePackChoices(els, state, packs);
    return packs;
  } catch {
    if (els.stylePackStatus)
      els.stylePackStatus.textContent =
        "Style libraries unavailable right now.";
    return [];
  }
};

const generateLivePreview = async (state, els) => {
  const prompt = (state.prompt || "").trim();
  if (!prompt) return;
  if (els.livePreviewStatus)
    els.livePreviewStatus.textContent = "Generating live preview...";
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        tone: state.theme,
        stylePackIds: state.stylePackIds || [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.siteId) {
      throw new Error(String(data?.error || "Generation failed."));
    }
    state.generatedSiteId = String(data.siteId || "");
    state.generatedPreviewUrl = toAbsoluteUrl(
      data.previewUrl || `/preview/${state.generatedSiteId}`
    );
    state.generatedLayout = data.layout || null;
    saveState(state);

    if (els.livePreviewStatus)
      els.livePreviewStatus.textContent = "Live preview ready.";
    if (els.livePreviewLink && state.generatedPreviewUrl) {
      els.livePreviewLink.href = state.generatedPreviewUrl;
      els.livePreviewLink.classList.remove("is-hidden");
    }
    if (els.livePreviewFrame && state.generatedPreviewUrl) {
      els.livePreviewFrame.src = state.generatedPreviewUrl;
      els.livePreviewFrame.classList.remove("is-hidden");
    }
  } catch (err) {
    if (els.livePreviewStatus) {
      els.livePreviewStatus.textContent = `Live preview failed: ${err?.message || "unknown error"}`;
    }
  }
};

const renderPreview = (state, els) => {
  const outline = generateOutline({
    siteType: state.siteType,
    prompt: state.prompt,
  });
  const generatedPages = Array.isArray(state.generatedLayout?.pages)
    ? state.generatedLayout.pages
    : [];
  const listItems = generatedPages.length
    ? generatedPages.map((page) => String(page?.title || page?.slug || "Page"))
    : outline.sections;

  if (els.previewTitle) {
    els.previewTitle.textContent =
      state.generatedLayout?.title || outline.title;
  }
  if (els.previewList) {
    els.previewList.innerHTML = "";
    listItems.forEach((section) => {
      const li = document.createElement("li");
      li.textContent = section;
      els.previewList.appendChild(li);
    });
  }
  if (els.previewNext) {
    els.previewNext.textContent = state.generatedPreviewUrl
      ? "Preview looks right? Save by email to get your link + PayPal options."
      : "Generate a live preview, then save by email.";
  }
  if (els.livePreviewLink) {
    if (state.generatedPreviewUrl) {
      els.livePreviewLink.href = state.generatedPreviewUrl;
      els.livePreviewLink.classList.remove("is-hidden");
    } else {
      els.livePreviewLink.classList.add("is-hidden");
    }
  }
  if (els.livePreviewFrame) {
    if (state.generatedPreviewUrl) {
      els.livePreviewFrame.src = state.generatedPreviewUrl;
      els.livePreviewFrame.classList.remove("is-hidden");
    } else {
      els.livePreviewFrame.classList.add("is-hidden");
    }
  }
};

const showStep = (state, els) => {
  const step = clamp(Number(state.step || 1), 1, 5);
  state.step = step;

  els.steps.forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.step) === step);
  });
  els.panels.forEach((el) => {
    el.classList.toggle("is-hidden", Number(el.dataset.panel) !== step);
  });

  if (els.prompt && els.prompt.value !== state.prompt)
    els.prompt.value = state.prompt || "";
  if (step === 4) renderPreview(state, els);
  saveState(state);
};

const wireChoices = (state) => {
  document.addEventListener("click", (event) => {
    const siteChoice = event.target.closest("[data-choice]");
    if (siteChoice) {
      state.siteType = siteChoice.getAttribute("data-choice") || state.siteType;
      document
        .querySelectorAll("[data-choice]")
        .forEach((el) => el.classList.toggle("is-selected", el === siteChoice));
      saveState(state);
    }

    const themeChoice = event.target.closest("[data-theme]");
    if (themeChoice) {
      state.theme = themeChoice.getAttribute("data-theme") || state.theme;
      document
        .querySelectorAll("[data-theme]")
        .forEach((el) =>
          el.classList.toggle("is-selected", el === themeChoice)
        );
      setTheme(state.theme);
      saveState(state);
    }

    const stylePackChoice = event.target.closest("[data-style-pack]");
    if (stylePackChoice) {
      const id = String(
        stylePackChoice.getAttribute("data-style-pack") || ""
      ).trim();
      if (!id) return;
      const exists = state.stylePackIds.includes(id);
      state.stylePackIds = exists
        ? state.stylePackIds.filter((v) => v !== id)
        : [...state.stylePackIds, id];
      stylePackChoice.classList.toggle("is-selected", !exists);
      const status = document.getElementById("stylePackStatus");
      if (status) {
        status.textContent = state.stylePackIds.length
          ? `${state.stylePackIds.length} style libraries selected.`
          : "No style packs selected yet.";
      }
      saveState(state);
    }
  });
};

const wireNavButtons = (state, els) => {
  document.addEventListener("click", (event) => {
    const nextBtn = event.target.closest("[data-next]");
    const prevBtn = event.target.closest("[data-prev]");
    if (!nextBtn && !prevBtn) return;

    if (nextBtn) {
      if (state.step === 2) {
        const text = (els.prompt?.value || "").trim();
        if (!text) {
          els.micStatus &&
            (els.micStatus.textContent = "Add a prompt to continue.");
          return;
        }
        if (text !== state.prompt) {
          state.generatedSiteId = "";
          state.generatedPreviewUrl = "";
          state.generatedLayout = null;
        }
        state.prompt = text;
      }
      state.step += 1;
    } else if (prevBtn) {
      state.step -= 1;
    }

    showStep(state, els);
    if (state.step === 4) {
      void generateLivePreview(state, els).then(() =>
        renderPreview(state, els)
      );
    }
  });
};

const wirePrompt = (state, els) => {
  els.prompt?.addEventListener("input", () => {
    if ((els.prompt.value || "").trim() !== (state.prompt || "").trim()) {
      state.generatedSiteId = "";
      state.generatedPreviewUrl = "";
      state.generatedLayout = null;
    }
    state.prompt = els.prompt.value;
    saveState(state);
  });
};

const createRecognition = (els) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0])
      .map((r) => r.transcript)
      .join("");
    if (els.prompt) els.prompt.value = transcript;
  };
  recognition.onerror = () => {
    if (els.micStatus) els.micStatus.textContent = "Voice capture failed.";
  };
  recognition.onend = () => {
    if (els.micStatus) els.micStatus.textContent = "Voice capture stopped.";
  };

  return recognition;
};

const wireMic = (state, els) => {
  const recognition = createRecognition(els);
  if (!els.micBtn) return;

  if (!recognition) {
    els.micBtn.setAttribute("disabled", "true");
    els.micBtn.title = "Voice capture not supported in this browser.";
    return;
  }

  let isRunning = false;
  els.micBtn.addEventListener("click", () => {
    if (!isRunning) {
      isRunning = true;
      els.micBtn.classList.add("is-selected");
      els.micStatus && (els.micStatus.textContent = "Listening…");
      recognition.start();
      return;
    }
    isRunning = false;
    els.micBtn.classList.remove("is-selected");
    recognition.stop();
    state.prompt = (els.prompt?.value || "").trim();
    saveState(state);
  });
};

const wireSave = (state, els) => {
  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

  const loadBuilds = () =>
    safeJsonParse(localStorage.getItem(SAVED_BUILDS_KEY) || "[]", []);
  const saveBuilds = (list) =>
    localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(list.slice(0, 50)));

  els.saveBtn?.addEventListener("click", async () => {
    const email = (els.email?.value || "").trim();
    if (!isValidEmail(email)) {
      els.saveStatus && (els.saveStatus.textContent = "Enter a valid email.");
      return;
    }
    if (!(state.prompt || "").trim()) {
      els.saveStatus && (els.saveStatus.textContent = "Add a prompt first.");
      return;
    }

    if (els.saveBtn) els.saveBtn.setAttribute("disabled", "true");
    if (els.saveStatus)
      els.saveStatus.textContent = "Saving and sending email...";
    renderSaveLinks(els, []);

    const build = {
      email,
      siteType: state.siteType,
      theme: state.theme,
      prompt: state.prompt,
      stylePackIds: state.stylePackIds || [],
      ts: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/demo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(build),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(String(data?.error || "Save failed."));
      }
      state.generatedSiteId = String(
        data?.siteId || state.generatedSiteId || ""
      );
      state.generatedPreviewUrl = toAbsoluteUrl(
        data?.previewUrl ||
          (state.generatedSiteId ? `/preview/${state.generatedSiteId}` : "") ||
          state.generatedPreviewUrl ||
          ""
      );
      state.generatedLayout = data?.layout || state.generatedLayout || null;
      saveState(state);
      renderPreview(state, els);

      const linkItems = [];
      if (state.generatedPreviewUrl) {
        linkItems.push({
          label: "Open your live preview",
          href: state.generatedPreviewUrl,
        });
      }
      (data?.paymentOptions || []).forEach((option) => {
        if (option?.label && option?.link) {
          linkItems.push({
            label: `Buy ${option.label} (PayPal)`,
            href: option.link,
          });
        }
      });
      renderSaveLinks(els, linkItems);

      const emailSent = Boolean(data?.email?.sent);
      els.saveStatus &&
        (els.saveStatus.textContent = emailSent
          ? "Done. Email sent with your preview link and PayPal options."
          : `Saved, but email failed: ${data?.email?.error || "delivery issue"}`);
      if (els.email) els.email.value = "";
    } catch (err) {
      els.saveStatus &&
        (els.saveStatus.textContent = `Save failed: ${err?.message || "unknown error"}`);
      // Keep local fallback so the user does not lose progress.
      const list = loadBuilds();
      list.unshift(build);
      saveBuilds(list);
    } finally {
      if (els.saveBtn) els.saveBtn.removeAttribute("disabled");
    }
  });
};

const renderGallery = (els, state) => {
  if (!els.gallery) return;
  els.gallery.innerHTML = "";
  COMMANDS.forEach((cmd) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-card";
    btn.textContent = cmd;
    btn.addEventListener("click", () => {
      state.prompt = cmd;
      saveState(state);
      if (els.prompt) els.prompt.value = cmd;
      state.step = 2;
      showStep(state, els);
      window.location.hash = "#demo";
    });
    els.gallery.appendChild(btn);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const els = getEls();
  const state = loadState();

  const prefillRaw = localStorage.getItem("vtw-demo-prefill");
  if (prefillRaw) {
    const prefill = safeJsonParse(prefillRaw, null);
    if (prefill?.prompt) {
      state.prompt = String(prefill.prompt);
      state.step = 2;
    }
    localStorage.removeItem("vtw-demo-prefill");
  }

  setTheme(state.theme);
  wireChoices(state);
  wireNavButtons(state, els);
  wirePrompt(state, els);
  wireMic(state, els);
  wireSave(state, els);
  renderGallery(els, state);
  void fetchStylePacks(els, state);

  showStep(state, els);
  if (state.step === 4 && (state.prompt || "").trim()) {
    void generateLivePreview(state, els).then(() => renderPreview(state, els));
  }
});
