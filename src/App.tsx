import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BACKGROUND_TUNNEL, INTRO_SONG, INTRO_VIDEO, NAV_LINKS } from './constants';
import { NavigationLink } from './types';
import { audioEngine } from './services/audioEngine';
import WarpTunnel from './components/WarpTunnel';
import ElectricText from './components/ElectricText';
import AudioWaveform from './components/AudioWaveform';

const SEEN_KEY = 'vtw-v2-seen';

const hasSeenV2 = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch (_) {
    return false;
  }
};

const markSeenV2 = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch (_) {}
};

const buildInstantOutline = (prompt: string) => {
  const text = (prompt || '').trim();
  const lower = text.toLowerCase();

  const sections = [
    'Hero + CTA',
    'How it works (5 steps)',
    'Use cases (tabs)',
    'Feature blocks',
    'Social proof',
    'Pricing preview',
    'FAQ',
    'Footer (Trust + Status)',
  ];

  if (lower.includes('booking')) sections.splice(2, 0, 'Booking + availability');
  if (lower.includes('portfolio') || lower.includes('gallery'))
    sections.splice(2, 0, 'Portfolio / reel');
  if (lower.includes('ecommerce') || lower.includes('store'))
    sections.splice(2, 0, 'Products + bundles');
  if (lower.includes('blog')) sections.splice(6, 0, 'Blog hub (topic clusters)');

  return {
    title: text ? `Preview: ${text}` : 'Preview (instant)',
    sections,
  };
};

const App: React.FC = () => {
  const seen = hasSeenV2();
  const [phase, setPhase] = useState<'opener' | 'site'>(seen ? 'site' : 'opener');
  const [openerCollapsed, setOpenerCollapsed] = useState(seen);
  const [showBumper, setShowBumper] = useState(seen);
  const [isWarping, setIsWarping] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [tryPrompt, setTryPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const reduceMotion = useReducedMotion();

  const [activeUseCase, setActiveUseCase] = useState<
    'creators' | 'agencies' | 'local' | 'ecommerce' | 'wordpress'
  >('creators');

  const secretTapRef = useRef<number[]>([]);
  const handleSecretTap = () => {
    const now = Date.now();
    const taps = secretTapRef.current.filter((t) => now - t < 1500);
    taps.push(now);
    secretTapRef.current = taps;
    if (taps.length >= 6) window.location.href = '/the3000.html';
  };

  useEffect(() => {
    if (!showBumper) return;
    const timer = window.setTimeout(() => setShowBumper(false), 1400);
    return () => window.clearTimeout(timer);
  }, [showBumper]);

  useEffect(() => {
    try {
      document.documentElement.dataset.vtwPhase = phase;
    } catch (_) {}
    return () => {
      try {
        delete document.documentElement.dataset.vtwPhase;
      } catch (_) {}
    };
  }, [phase]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setTryPrompt(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (!isListening) {
      setIsListening(true);
      try {
        recognition.start();
      } catch (_) {}
      return;
    }
    try {
      recognition.stop();
    } catch (_) {}
  };

  const toggleAudio = () => {
    audioEngine.enable();
    if (isAudioPlaying) {
      audioEngine.stopMusic();
      setIsAudioPlaying(false);
      return;
    }
    audioEngine.playMusic(INTRO_SONG);
    setIsAudioPlaying(true);
  };

  const enterSite = () => {
    markSeenV2();
    setOpenerCollapsed(true);
    setPhase('site');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== ' ') return;

      if (phase === 'opener' && !openerCollapsed) {
        event.preventDefault();
        enterSite();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (phase !== 'opener' || openerCollapsed) return;
      if (event.deltaY > 0) enterSite();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel as any);
    };
  }, [phase, openerCollapsed]);

  const handleTileClick = (link: NavigationLink) => {
    markSeenV2();
    audioEngine.playImpact();
    if (reduceMotion) {
      window.location.href = link.url;
      return;
    }
    setTimeout(() => {
      audioEngine.playSwoosh();
      setIsWarping(true);
      audioEngine.playWarp();
    }, 220);
    setTimeout(() => {
      window.location.href = link.url;
    }, 1100);
  };

  const preview = useMemo(() => buildInstantOutline(tryPrompt), [tryPrompt]);

  const useCases = {
    creators: {
      label: 'Creators',
      prompt: 'Build a creator portfolio with a reel section and email capture.',
      bullets: ['Publish faster', 'Capture emails', 'Monetize content'],
      template: 'Creator Portfolio',
      integration: 'YouTube + Newsletter',
    },
    agencies: {
      label: 'Agencies',
      prompt: 'Create an agency homepage with services, case studies, and a contact form.',
      bullets: ['Ship client sites', 'Reuse templates', 'Reduce revisions'],
      template: 'Agency Landing',
      integration: 'CRM + Scheduling',
    },
    local: {
      label: 'Local',
      prompt: 'Create a landing page for a barber shop with booking and pricing.',
      bullets: ['Rank locally', 'Drive calls', 'Book appointments'],
      template: 'Local Service',
      integration: 'Maps + Booking',
    },
    ecommerce: {
      label: 'Ecommerce',
      prompt: 'Design an ecommerce storefront with bundles, reviews, and FAQs.',
      bullets: ['Bundles + upsells', 'Fast pages', 'Trust-first checkout'],
      template: 'Storefront',
      integration: 'Stripe + PayPal',
    },
    wordpress: {
      label: 'WordPress',
      prompt: 'Create a WordPress migration landing page with SEO checklist and pricing.',
      bullets: ['Migration plan', 'SEO cleanup', 'Performance lift'],
      template: 'WP Migration',
      integration: 'Analytics + Redirects',
    },
  } as const;

  const active = useCases[activeUseCase];

  const seedDemoPrompt = (prompt: string) => {
    setTryPrompt(prompt);
    try {
      localStorage.setItem('vtw-demo-prefill', JSON.stringify({ prompt, ts: Date.now() }));
    } catch (_) {}
  };

  return (
    <div className="relative min-h-screen bg-black select-none overflow-x-hidden">
      <WarpTunnel isVisible={!reduceMotion && isWarping} />

      {/* Background atmosphere */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-20 brightness-50"
        >
          <source src={BACKGROUND_TUNNEL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />
      </div>

      {/* Returning visitor bumper */}
      <AnimatePresence>
        {showBumper && phase === 'site' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] grid place-items-center bg-black/80 backdrop-blur-md"
          >
            <div className="text-center px-6">
              <div className="font-orbitron tracking-[0.5em] text-white/70 text-xs">
                VOICETOWEBSITE
              </div>
              <div className="mt-5 grid place-items-center" aria-hidden="true">
                <AudioWaveform
                  active={isAudioPlaying}
                  mode="bumper"
                  className="vt-waveform vt-waveform-bumper"
                />
              </div>
              <div className="mt-5 text-white/40 text-sm">Systems nominal</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent audio control */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-16 right-4 z-[160] flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-2xl"
      >
        <button
          type="button"
          onClick={toggleAudio}
          className="flex items-center gap-2"
          aria-label={isAudioPlaying ? 'Stop soundtrack' : 'Play soundtrack'}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${isAudioPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`}
          />
          <span className="font-orbitron text-[10px] tracking-[0.2em] text-white/60 uppercase whitespace-nowrap">
            {isAudioPlaying ? 'SOUND ON' : 'SOUND OFF'}
          </span>
        </button>
        <input
          aria-label="Soundtrack volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 accent-white h-1 bg-white/20 rounded-lg appearance-none"
        />
      </motion.div>

      {/* Hidden 3000 entry */}
      <button
        type="button"
        onClick={handleSecretTap}
        aria-label="Open 3000 portal"
        className="fixed top-3 left-3 z-[160] h-8 w-8 rounded-full border border-white/10 bg-white/5 opacity-0 backdrop-blur-md transition-opacity hover:opacity-25 focus:opacity-40"
      >
        <span className="sr-only">3000</span>
      </button>

      {/* Opener / hero */}
      <motion.section
        id="opener"
        className="relative z-10 w-full overflow-hidden"
        animate={{ minHeight: openerCollapsed ? 520 : '100vh' }}
        transition={{ duration: 0.9, ease: 'circInOut' }}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-700 ${openerCollapsed ? 'opacity-20' : 'opacity-40'}`}
          >
            <source src={INTRO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
          <AudioWaveform active={isAudioPlaying} className="vt-waveform" />
        </div>

        {!openerCollapsed && (
          <button
            type="button"
            onClick={enterSite}
            className="fixed top-28 right-4 z-[170] px-4 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:border-white/30 transition"
          >
            Skip intro (Esc / Space)
          </button>
        )}

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16">
          <AnimatePresence mode="wait" initial={false}>
            {!openerCollapsed ? (
              <motion.div
                key="opener"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 16, clipPath: 'circle(140% at 50% 50%)' }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1, transition: { duration: 0.35 } }
                    : {
                        opacity: 1,
                        y: 0,
                        clipPath: 'circle(140% at 50% 50%)',
                        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                      }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : {
                        opacity: 0,
                        y: -8,
                        clipPath: 'circle(0% at 50% 18%)',
                        transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
                      }
                }
              >
                <div className="max-w-3xl">
                  <div className="font-orbitron text-[11px] tracking-[0.35em] text-white/60 uppercase">
                    Voice-first web engineering
                  </div>
                  <h1 className="mt-4 text-white font-orbitron font-black text-3xl md:text-5xl tracking-[0.08em] uppercase">
                    Your song. Your opener. Your funnel.
                  </h1>
                  <p className="mt-5 text-white/60 text-lg leading-relaxed">
                    Scroll, click, or press Space to peel into the site. The tiles below are
                    navigation — each one maps to a CTA.
                  </p>
                  {!isAudioPlaying && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleAudio}
                        className="px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white hover:text-black transition font-bold"
                      >
                        Start song
                      </button>
                      <span className="text-white/40 text-xs uppercase tracking-[0.35em]">
                        Autoplay muted by default
                      </span>
                    </div>
                  )}
                </div>

                <motion.div
                  className="mt-10 grid grid-cols-1 md:grid-cols-5 gap-3"
                  style={{ perspective: 1200 }}
                  variants={
                    reduceMotion
                      ? {
                          initial: {},
                          animate: { transition: { staggerChildren: 0.02, delayChildren: 0.08 } },
                          exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
                        }
                      : {
                          initial: {},
                          animate: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
                          exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
                        }
                  }
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {NAV_LINKS.map((link) => (
                    <motion.button
                      key={link.id}
                      type="button"
                      onClick={() => handleTileClick(link)}
                      className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/40 text-left group"
                      style={{ transformStyle: 'preserve-3d' }}
                      variants={
                        reduceMotion
                          ? {
                              initial: { opacity: 0 },
                              animate: {
                                opacity: 1,
                                transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                              },
                              exit: { opacity: 0, transition: { duration: 0.18 } },
                            }
                          : {
                              initial: {
                                opacity: 0,
                                y: 18,
                                rotateX: -12,
                                filter: 'blur(4px)',
                                clipPath: 'inset(0% 0% 0% 0% round 16px)',
                              },
                              animate: {
                                opacity: 1,
                                y: 0,
                                rotateX: 0,
                                filter: 'blur(0px)',
                                clipPath: 'inset(0% 0% 0% 0% round 16px)',
                                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                              },
                              exit: {
                                opacity: 0,
                                y: -28,
                                rotateX: 22,
                                clipPath: 'inset(0% 0% 100% 0% round 16px)',
                                transition: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
                              },
                            }
                      }
                    >
                      <video
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-95 transition"
                      >
                        <source src={link.videoUrl} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/35 transition" />
                      <div className="relative z-10 p-5 min-h-[170px] flex flex-col justify-between">
                        <div>
                          <ElectricText
                            text={link.label}
                            className="text-sm tracking-[0.35em]"
                            active={false}
                          />
                          <p className="mt-3 text-white/60 text-sm leading-relaxed">
                            {link.description}
                          </p>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 text-white/70 text-xs uppercase tracking-[0.3em]">
                          Open <span aria-hidden="true">→</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={enterSite}
                    className="px-5 py-3 rounded-full bg-white text-black font-bold"
                  >
                    Enter site
                  </button>
                  <a
                    className="px-5 py-3 rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white hover:text-black transition font-bold"
                    href="/demo"
                  >
                    Try the demo now
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hero"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{ opacity: 0 }}
              >
                <div className="page" id="home">
                  <section className="section hero">
                    <p className="eyebrow">Home</p>
                    <h1 className="vt-h1">Voice to Website Builder — Speak It. Ship It.</h1>
                    <p className="subhead">
                      Turn voice into a complete, responsive, SEO-ready website with pages,
                      copy, templates, and one-click publish — then keep improving.
                    </p>
                    <div className="cta-row">
                      <a className="btn btn-primary" href="/demo">
                        Start Free Voice Build
                      </a>
                      <a className="btn btn-ghost" href="/demo#video">
                        Watch 60-Second Demo
                      </a>
                    </div>
                    <div className="trust-strip" role="note">
                      <span>No credit card</span>
                      <span>Privacy-first posture</span>
                      <span>Lighthouse targets 90+/95+</span>
                    </div>

                    <div className="vt-grid" style={{ marginTop: '1.6rem' }}>
                      <div className="feature-card">
                        <h3>Try a command</h3>
                        <p className="muted">Type or tap mic. Edit before generate.</p>
                        <div className="prompt-shell">
                          <label className="prompt-label" htmlFor="tryCommand">
                            Command
                          </label>
                          <textarea
                            id="tryCommand"
                            rows={3}
                            value={tryPrompt}
                            onChange={(e) => setTryPrompt(e.target.value)}
                            placeholder="Create a landing page for a barber shop with booking and pricing…"
                          />
                          <div className="prompt-actions">
                            <button
                              className="btn btn-ghost"
                              type="button"
                              onClick={toggleListening}
                            >
                              {isListening ? 'Stop mic' : 'Mic'}
                            </button>
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => {
                                seedDemoPrompt(tryPrompt);
                                window.location.href = '/demo';
                              }}
                            >
                              Open demo with this
                            </button>
                          </div>
                        </div>
                        <div className="vt-grid" style={{ marginTop: '0.9rem' }}>
                          {[
                            'Create a landing page for a barber shop',
                            'Make it dark glass with neon blue accents',
                            'Add pricing + booking + FAQ',
                          ].map((chip) => (
                            <button
                              key={chip}
                              className="choice-card"
                              type="button"
                              onClick={() => seedDemoPrompt(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="feature-card">
                        <h3>Instant preview</h3>
                        <p className="muted">A fast outline preview (dopamine-first).</p>
                        <div className="preview-card">
                          <div className="preview-title">{preview.title}</div>
                          <ul className="preview-list">
                            {preview.sections.slice(0, 8).map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {openerCollapsed && (
        <main className="page relative z-10">
          <section className="section">
            <h2>How it works</h2>
            <p className="subhead">Five steps. One safety gate. Infinite iteration.</p>
            <div className="vt-grid">
              {[
                ['Speak prompt', 'Voice or type commands anywhere.'],
                ['Generate structure', 'Pages + sections + internal links.'],
                ['Apply design system', 'Tokens + components + motion.'],
                ['Write copy + SEO', 'Titles, meta, schema, headings.'],
                ['Publish + optimize', 'Performance defaults + reports.'],
              ].map(([t, d], idx) => (
                <article className="feature-card" key={t}>
                  <div className="pill">{idx + 1}</div>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Use cases</h2>
            <p className="subhead">Creator, agency, local, ecommerce, WordPress migration.</p>
            <div className="toggle-row" role="tablist" aria-label="Use cases">
              {(Object.keys(useCases) as Array<keyof typeof useCases>).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`pill-toggle ${activeUseCase === key ? 'is-active' : ''}`}
                  role="tab"
                  aria-selected={activeUseCase === key}
                  onClick={() => setActiveUseCase(key)}
                >
                  {useCases[key].label}
                </button>
              ))}
            </div>

            <div className="vt-grid" style={{ marginTop: '1rem' }}>
              <article className="feature-card">
                <h3>{active.label} wins</h3>
                <ul className="preview-list">
                  {active.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
              <article className="feature-card">
                <h3>Template</h3>
                <p className="muted">{active.template}</p>
                <h3 style={{ marginTop: '0.65rem' }}>Integration</h3>
                <p className="muted">{active.integration}</p>
              </article>
              <article className="feature-card">
                <h3>Build this now</h3>
                <p className="muted">{active.prompt}</p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    seedDemoPrompt(active.prompt);
                    window.location.href = '/demo';
                  }}
                >
                  Open demo
                </button>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>Feature blocks</h2>
            <p className="subhead">The load-bearing parts.</p>
            <div className="vt-grid">
              {[
                ['Voice layout generation', 'Turn intent into sections and hierarchy.'],
                ['Auto copy + tone', 'Benefit-driven copy with microcopy.'],
                ['SEO + schema', 'FAQ, Product, Video, Article scaffolding.'],
                ['Performance defaults', 'Lazy-load, caching, reduced motion.'],
                ['A/B suggestions', 'Ideas based on funnel friction.'],
                ['Monetization kit', 'Subscriptions, Store, App Store, affiliates.'],
              ].map(([t, d]) => (
                <article className="feature-card" key={t}>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Pricing preview</h2>
            <p className="subhead">Free → Creator → Pro → Agency.</p>
            <div className="vt-grid">
              {[
                ['Free', '$0', '1 demo build'],
                ['Creator', '$39/mo', '1 site + blog hub'],
                ['Pro', '$79/mo', '3 sites + integrations'],
              ].map(([t, p, d]) => (
                <article className="feature-card" key={t}>
                  <h3>{t}</h3>
                  <div className="metric-lg" style={{ fontSize: '2.4rem' }}>
                    {p}
                  </div>
                  <p className="muted">{d}</p>
                  <a className="btn btn-ghost" href="/pricing">
                    Compare plans
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Store + App Store</h2>
            <p className="subhead">Products, templates, integrations, and kits.</p>
            <div className="vt-grid">
              <article className="feature-card">
                <h3>Store</h3>
                <p className="muted">Hardware + digital bundles, upsells.</p>
                <a className="btn btn-primary" href="/store">
                  Open store
                </a>
              </article>
              <article className="feature-card">
                <h3>App Store</h3>
                <p className="muted">Templates + integrations + bots.</p>
                <a className="btn btn-ghost" href="/appstore">
                  Open App Store
                </a>
              </article>
              <article className="feature-card">
                <h3>Partners</h3>
                <p className="muted">Affiliates, agencies, integrators.</p>
                <a className="btn btn-ghost" href="/partners">
                  Partner program
                </a>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>Live + blog</h2>
            <p className="subhead">Replays become SEO pages with Video schema.</p>
            <div className="vt-grid">
              <article className="feature-card">
                <h3>Live</h3>
                <p className="muted">Live builds + replays.</p>
                <a className="btn btn-primary" href="/livestream">
                  Go live
                </a>
              </article>
              <article className="feature-card">
                <h3>Blog</h3>
                <p className="muted">Topic clusters and resources.</p>
                <a className="btn btn-ghost" href="/blog">
                  Open blog
                </a>
              </article>
              <article className="feature-card">
                <h3>Trust + status</h3>
                <p className="muted">Security posture and incidents.</p>
                <a className="btn btn-ghost" href="/trust">
                  Trust Center
                </a>
              </article>
            </div>
          </section>

          <section className="section">
            <h2>FAQ</h2>
            <div className="vt-accordion">
              <details className="accordion-item">
                <summary>Do I own my site and content?</summary>
                <p className="muted">Yes. Your pages and copy are yours.</p>
              </details>
              <details className="accordion-item">
                <summary>How does Plan → Apply → Rollback work?</summary>
                <p className="muted">
                  You preview changes first, confirm explicitly, then apply. Undo restores
                  the last change.
                </p>
              </details>
              <details className="accordion-item">
                <summary>Does this hurt performance?</summary>
                <p className="muted">
                  No. Lazy-load, caching, and reduced motion are built in.
                </p>
              </details>
            </div>
          </section>
        </main>
      )}

      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, black 100%);
        }
      `}</style>
    </div>
  );
};

export default App;
