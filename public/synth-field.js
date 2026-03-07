(() => {
  const doc = document;
  const win = window;
  const root = doc.documentElement;
  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")
    ?.matches;
  const saveData =
    navigator.connection && navigator.connection.saveData === true;

  const pageKey = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const topic = pageKey
    .replace(/^\/+/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase()) || "Home";

  const hash = [...pageKey].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 17);
  const palettes = [
    ["#00d2ff", "#5b2cff", "#ff2da6"],
    ["#3cf8c8", "#0ea5e9", "#a855f7"],
    ["#22d3ee", "#f43f5e", "#6366f1"],
    ["#67e8f9", "#c084fc", "#f59e0b"],
  ];
  const palette = palettes[Math.abs(hash) % palettes.length];

  const field = doc.createElement("div");
  field.id = "vtw-synth-field";
  if (!saveData) {
    const video = doc.createElement("video");
    video.id = "vtw-synth-video";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-hidden", "true");
    const source = doc.createElement("source");
    source.src = "/media/vtw-home-wallpaper.mp4";
    source.type = "video/mp4";
    video.appendChild(source);
    field.appendChild(video);
  }
  const canvas = doc.createElement("canvas");
  canvas.id = "vtw-synth-canvas";
  field.appendChild(canvas);
  doc.body.prepend(field);
  root.classList.add("vtw-synth-active");

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const pointer = { x: 0.5, y: 0.45, z: 0 };
  let scrollY = 0;
  let gyroX = 0;
  let gyroY = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;

  const resize = () => {
    const vw = Math.max(1, win.innerWidth || 1);
    const vh = Math.max(1, win.innerHeight || 1);
    dpr = Math.min(win.devicePixelRatio || 1, vw < 700 ? 1.5 : 2);
    w = vw;
    h = vh;
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const onPointer = (x, y) => {
    pointer.x = clamp(x / Math.max(1, w), 0, 1);
    pointer.y = clamp(y / Math.max(1, h), 0, 1);
  };

  win.addEventListener("mousemove", (e) => onPointer(e.clientX, e.clientY), {
    passive: true,
  });
  win.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches && e.touches[0];
      if (t) onPointer(t.clientX, t.clientY);
    },
    { passive: true }
  );
  win.addEventListener(
    "scroll",
    () => {
      scrollY = win.scrollY || win.pageYOffset || 0;
    },
    { passive: true }
  );

  const onOrientation = (e) => {
    gyroX = clamp((e.beta || 0) / 45, -1, 1);
    gyroY = clamp((e.gamma || 0) / 45, -1, 1);
  };

  const enableGyro = () => {
    if (!("DeviceOrientationEvent" in win)) return;
    const maybeRequest = DeviceOrientationEvent.requestPermission;
    if (typeof maybeRequest === "function") {
      const onFirstTap = async () => {
        try {
          const state = await maybeRequest.call(DeviceOrientationEvent);
          if (state === "granted") {
            win.addEventListener("deviceorientation", onOrientation, {
              passive: true,
            });
          }
        } catch {}
        win.removeEventListener("pointerdown", onFirstTap);
      };
      win.addEventListener("pointerdown", onFirstTap, { once: true });
      return;
    }
    win.addEventListener("deviceorientation", onOrientation, { passive: true });
  };
  enableGyro();

  const draw = (ts) => {
    raf = win.requestAnimationFrame(draw);
    if (!last) last = ts;
    const dt = ts - last;
    if (dt < 28 && !reducedMotion) return;
    last = ts;

    const t = ts * 0.001;
    ctx.clearRect(0, 0, w, h);

    const cx = w * (0.5 + (pointer.x - 0.5) * 0.09 + gyroY * 0.05);
    const horizon = h * (0.38 + (pointer.y - 0.5) * 0.08 + gyroX * 0.04);
    const depth = 26;
    const sway = (pointer.x - 0.5) * 18 + gyroY * 20;
    const scrollInfluence = Math.min(scrollY / 4000, 0.45);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `${palette[2]}18`);
    skyGrad.addColorStop(0.45, `${palette[1]}10`);
    skyGrad.addColorStop(1, "#04040a00");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < depth; i++) {
      const z = i / depth;
      const y = horizon + Math.pow(z, 2.1) * (h - horizon + 160);
      const alpha = 0.12 + z * 0.36;
      ctx.strokeStyle = `${palette[0]}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 1 + z * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y + scrollInfluence * 24);
      ctx.lineTo(w, y + scrollInfluence * 24);
      ctx.stroke();
    }

    const cols = 18;
    for (let i = -cols; i <= cols; i++) {
      const x = cx + (i * (w / cols)) / 2 + sway;
      ctx.strokeStyle = `${palette[1]}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, h + 20);
      ctx.lineTo(cx + i * 7, horizon - 4);
      ctx.stroke();
    }

    const orbCount = saveData ? 4 : 9;
    for (let i = 0; i < orbCount; i++) {
      const phase = t * (0.15 + i * 0.03) + i * 1.73 + (hash % 10);
      const ox = w * (0.1 + ((i * 37) % 80) / 100) + Math.sin(phase) * 24;
      const oy = h * (0.12 + ((i * 29) % 48) / 100) + Math.cos(phase * 1.7) * 16;
      const r = 8 + ((i * 3) % 11);
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 3);
      g.addColorStop(0, `${palette[i % 3]}88`);
      g.addColorStop(1, `${palette[i % 3]}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const revealOnScroll = () => {
    const selectors =
      "section, article, .card, .feature, .panel, .tile, .module, .content-block";
    const nodes = doc.querySelectorAll(selectors);
    nodes.forEach((n, idx) => {
      if (idx < 180) n.classList.add("vtw-reveal");
    });
    if (!("IntersectionObserver" in win)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
  };

  const tuneMedia = () => {
    doc.querySelectorAll("img").forEach((img, idx) => {
      if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", idx < 2 ? "eager" : "lazy");
      }
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (!img.hasAttribute("fetchpriority") && idx === 0) {
        img.setAttribute("fetchpriority", "high");
      }
    });
    doc.querySelectorAll("video").forEach((video) => {
      if (!video.hasAttribute("preload")) video.setAttribute("preload", "metadata");
      if (!video.hasAttribute("playsinline")) video.setAttribute("playsinline", "");
    });
  };

  const buildPoster = () => {
    const poster = doc.createElement("img");
    poster.className = "vtw-context-poster";
    poster.alt = `${topic} synth visual`;
    poster.loading = "eager";
    poster.decoding = "async";
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop stop-color='${palette[0]}' />
            <stop offset='0.5' stop-color='${palette[1]}' />
            <stop offset='1' stop-color='${palette[2]}' />
          </linearGradient>
        </defs>
        <rect width='512' height='512' rx='32' fill='#070710'/>
        <rect x='20' y='20' width='472' height='472' rx='24' fill='url(#g)' opacity='0.28'/>
        <circle cx='128' cy='120' r='70' fill='url(#g)' opacity='0.45'/>
        <path d='M30 355 Q 255 220 482 355 L482 482 30 482 Z' fill='#04050a'/>
        <text x='38' y='410' fill='white' font-size='42' font-family='Segoe UI, Arial, sans-serif' font-weight='700'>${topic
          .slice(0, 18)
          .replace(/&/g, "&amp;")}</text>
      </svg>`;
    poster.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    doc.body.appendChild(poster);
  };

  resize();
  win.addEventListener("resize", resize, { passive: true });
  tuneMedia();
  revealOnScroll();
  buildPoster();

  if (!reducedMotion) {
    raf = win.requestAnimationFrame(draw);
  }

  win.addEventListener("beforeunload", () => {
    if (raf) win.cancelAnimationFrame(raf);
  });
})();
