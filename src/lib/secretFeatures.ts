/**
 * SECRET FEATURES — VoiceToWebsite.com
 * Hidden easter eggs earned as penalty rewards.
 * Not documented anywhere except here.
 */

type SecretMode = 'ultra' | 'elite' | 'devvision' | 'founder';

const ACTIVE_MODES = new Set<SecretMode>();
const listeners: Array<(modes: Set<SecretMode>) => void> = [];

export function onSecretModeChange(cb: (modes: Set<SecretMode>) => void) {
  listeners.push(cb);
  return () => { const i = listeners.indexOf(cb); if (i > -1) listeners.splice(i, 1); };
}

function emit() {
  listeners.forEach(cb => cb(new Set(ACTIVE_MODES)));
}

export function isActive(mode: SecretMode) { return ACTIVE_MODES.has(mode); }
export function getActiveModes() { return new Set(ACTIVE_MODES); }

function activate(mode: SecretMode, label: string, color: string) {
  if (ACTIVE_MODES.has(mode)) return;
  ACTIVE_MODES.add(mode);
  emit();
  showToast(label, color);
  console.log(`%c🔓 ${label} UNLOCKED`, `color:${color};font-size:18px;font-weight:900;`);
}

function showToast(message: string, color: string) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
    background:rgba(0,0,0,0.95);border:1px solid ${color};color:${color};
    padding:14px 28px;border-radius:50px;font-family:monospace;font-size:13px;font-weight:700;
    letter-spacing:.1em;z-index:999999;box-shadow:0 0 40px ${color}44;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .4s;opacity:0;
    pointer-events:none;text-transform:uppercase;
  `;
  el.textContent = `🔓 ${message}`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.opacity = '1';
  });
  setTimeout(() => {
    el.style.transform = 'translateX(-50%) translateY(80px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ─────────────────────────────────────────────
// EASTER EGG 1: KONAMI CODE → ULTRA MODE
// ↑ ↑ ↓ ↓ ← → ← → B A
// ─────────────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;

function handleKonami(e: KeyboardEvent) {
  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      activate('ultra', '⚡ ULTRA MODE ACTIVATED — Maximum AI Quality', '#00fff7');
      document.documentElement.style.setProperty('--ultra-mode', '1');
      konamiIdx = 0;
    }
  } else {
    konamiIdx = e.key === KONAMI[0] ? 1 : 0;
  }
}

// ─────────────────────────────────────────────
// EASTER EGG 2: TYPE "3000" → ELITE MODE
// ─────────────────────────────────────────────
let typedBuffer = '';
function handleTyped3000(e: KeyboardEvent) {
  typedBuffer = (typedBuffer + e.key).slice(-8);
  if (typedBuffer.includes('3000')) {
    activate('elite', '🔥 ELITE MODE — Triple-Pass AI Generation', '#ff6b00');
    typedBuffer = '';
  }
}

// ─────────────────────────────────────────────
// EASTER EGG 3: TYPE "IAMTHEFOUNDER" → FOUNDER MODE
// ─────────────────────────────────────────────
let founderBuffer = '';
function handleFounder(e: KeyboardEvent) {
  founderBuffer = (founderBuffer + e.key).slice(-15);
  if (founderBuffer.includes('IAMTHEFOUNDER')) {
    activate('founder', '👑 FOUNDER MODE — All Features Unlocked', '#ffd700');
    document.body.classList.add('founder-mode');
    founderBuffer = '';
  }
}

// ─────────────────────────────────────────────
// EASTER EGG 4: CLICK LOGO 7x → DEV VISION
// ─────────────────────────────────────────────
let logoClicks = 0;
let logoTimer: ReturnType<typeof setTimeout> | null = null;

export function handleLogoClick() {
  logoClicks++;
  if (logoTimer) clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoClicks = 0; }, 1500);
  if (logoClicks >= 7) {
    activate('devvision', '👁 DEV VISION — AI Stats Overlay', '#a855f7');
    logoClicks = 0;
    if (logoTimer) clearTimeout(logoTimer);
  }
}

// ─────────────────────────────────────────────
// PROMPT INTERCEPTOR — applies active modes to API calls
// ─────────────────────────────────────────────
export function enrichPrompt(prompt: string): { prompt: string; secretModes: string[] } {
  const modes: string[] = [];

  if (isActive('ultra')) {
    modes.push('ultra');
    prompt = `[ULTRA QUALITY - Maximum detail, cinematic design, elite copywriting] ${prompt}`;
  }
  if (isActive('elite')) {
    modes.push('elite');
    prompt = `[ELITE 3X REFINEMENT - Generate then self-critique then regenerate] ${prompt}`;
  }
  if (isActive('founder')) {
    modes.push('founder');
    prompt = `[FOUNDER SPECIAL - No limits, best possible output] ${prompt}`;
  }

  return { prompt, secretModes: modes };
}

// ─────────────────────────────────────────────
// DEV VISION OVERLAY
// ─────────────────────────────────────────────
let devOverlay: HTMLElement | null = null;

export function updateDevOverlay(stats: { tokens?: number; model?: string; ms?: number; layout?: string }) {
  if (!isActive('devvision')) return;

  if (!devOverlay) {
    devOverlay = document.createElement('div');
    devOverlay.id = 'vtw-devvision';
    devOverlay.style.cssText = `
      position:fixed;top:60px;right:16px;z-index:999998;
      background:rgba(0,0,0,0.92);border:1px solid #a855f7;
      color:#a855f7;font-family:monospace;font-size:11px;
      padding:12px 16px;border-radius:12px;min-width:220px;
      box-shadow:0 0 30px #a855f744;line-height:1.8;
    `;
    document.body.appendChild(devOverlay);
  }

  devOverlay.innerHTML = `
    <div style="color:#fff;font-weight:900;margin-bottom:6px;letter-spacing:.1em">👁 DEV VISION</div>
    <div>Model: <span style="color:#fff">${stats.model || 'gemini-2.0-flash-exp'}</span></div>
    <div>Tokens: <span style="color:#00fff7">${stats.tokens?.toLocaleString() || '—'}</span></div>
    <div>Latency: <span style="color:#ff6b00">${stats.ms ? stats.ms + 'ms' : '—'}</span></div>
    <div>Layout: <span style="color:#ffd700">${stats.layout || '—'}</span></div>
    <div>Modes: <span style="color:#ff6b00">${[...ACTIVE_MODES].join(', ') || 'none'}</span></div>
  `;
}

// ─────────────────────────────────────────────
// INIT — call once at app startup
// ─────────────────────────────────────────────
export function initSecretFeatures() {
  window.addEventListener('keydown', handleKonami);
  window.addEventListener('keydown', handleTyped3000);
  window.addEventListener('keydown', handleFounder);

  // Teaser in console for curious devs
  console.log('%c🔒 VoiceToWebsite Secret Features', 'color:#06b6d4;font-size:14px;font-weight:900;');
  console.log('%cSome things are hidden here. Find them if you can.', 'color:#666;font-size:11px;');
}
