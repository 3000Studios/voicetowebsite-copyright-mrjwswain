import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SHARED_NAV_ITEMS } from "../constants/navigation";

/** True if link should open in same tab as full page (admin or .html), not SPA */
const isAdminOrStatic = (href: string) =>
  href.startsWith("/admin") || href.includes(".html");

/** Shuffled delays for letter spin (fixed order so no hydration mismatch) */
const LETTER_DELAYS = [
  0, 1.1, 0.3, 0.8, 1.6, 0.2, 1.4, 0.5, 1.0, 0.7, 1.3, 0.1, 1.5, 0.4, 0.9, 1.2,
  0.6,
];
const LETTER_DURATIONS = [
  2.2, 2.8, 2.5, 3.0, 2.3, 2.9, 2.4, 3.1, 2.6, 2.7, 2.1, 3.2, 2.0, 2.5, 2.8,
  2.3, 2.6,
];

interface EnhancedHamburgerNavProps {
  isAdminAuthenticated?: boolean;
  onAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

const EnhancedHamburgerNav: React.FC<EnhancedHamburgerNavProps> = ({
  isAdminAuthenticated = false,
  onAdminLogin,
  onAdminLogout,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Sizzle sound effect
  const playSizzle = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }

    try {
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const bufferSize = audioCtx.sampleRate * 1.5;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Use crypto API for better randomness
      const randomValues = new Uint8Array(bufferSize);
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (randomValues[i]! / 255) * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();

      // Auto-cleanup after sound finishes
      setTimeout(() => {
        noise.stop();
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      }, 1500);
    } catch (error) {
      console.warn("Sizzle sound failed:", error);
    }
  };

  const handleNavClick = (
    href: string,
    requiresAuth: boolean,
    e: React.MouseEvent,
    isInternal: boolean
  ) => {
    if (requiresAuth && !isAdminAuthenticated && isAdminOrStatic(href)) {
      e.preventDefault();
      const code = prompt("Enter admin access code:");
      if (code === "ADMIN_ACCESS_2024" || code === "UNLOCK_ADMIN_123") {
        onAdminLogin?.();
        setShowAdminPanel(true);
      } else if (code) {
        alert("Invalid access code");
      }
      return;
    }

    playSizzle();
    const target = e?.currentTarget as HTMLElement;
    if (target) {
      target.classList.add("vtw-phosphor-melting");
    }

    if (isInternal) {
      setTimeout(() => {
        target?.classList.remove("vtw-phosphor-melting");
        setIsOpen(false);
        navigate(href);
      }, 400);
    } else {
      setTimeout(() => {
        target?.classList.remove("vtw-phosphor-melting");
        window.location.href = href;
      }, 400);
    }
  };

  const handleAdminLogout = () => {
    setShowAdminPanel(false);
    onAdminLogout?.();
    setIsOpen(false);
  };

  const handleRevealEverything = () => {
    // Reveal all hidden content
    document
      .querySelectorAll(".hidden-content, .admin-only, .developer-only")
      .forEach((el) => {
        const element = el as HTMLElement;
        element.classList.remove(
          "hidden-content",
          "admin-only",
          "developer-only"
        );
        element.style.display = "block";
        element.style.visibility = "visible";
      });

    // Unlock all features
    window.localStorage.setItem("VTW_UNLOCKED", "true");
    window.localStorage.setItem("VTW_UNLOCK_TIME", Date.now().toString());

    alert("All features revealed! 🎉");
  };

  return (
    <>
      {/* CRT Overlay */}
      <div className="fixed inset-0 w-full h-full z-[1000] pointer-events-none opacity-20 bg-gradient-to-b from-black via-transparent to-black" />
      <div
        className="fixed inset-0 w-full h-full z-[999] pointer-events-none opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "100% 4px",
        }}
      />

      {/* Hamburger: VOICETOWEBSITE.COM (3D, letter-spin) + animated 3 lines */}
      <div className="fixed top-6 right-6 z-[2000] flex items-center gap-3">
        <span className="vtw-hamburger-brand" aria-hidden="true">
          {"VOICETOWEBSITE.COM".split("").map((char, i) => (
            <span
              key={`${i}-${char}`}
              className="vtw-hamburger-letter"
              style={{
                animationDelay: `${LETTER_DELAYS[i % LETTER_DELAYS.length]}s`,
                animationDuration: `${LETTER_DURATIONS[i % LETTER_DURATIONS.length]}s`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-[2001] group vtw-hamburger-btn"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen ? true : false}
        >
          <div className="vtw-hamburger-lines">
            <span className="vtw-hamburger-line vtw-hamburger-line-1" />
            <span className="vtw-hamburger-line vtw-hamburger-line-2" />
            <span className="vtw-hamburger-line vtw-hamburger-line-3" />
          </div>
        </button>
      </div>

      {/* Fullscreen Menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 w-full h-full bg-black transition-all duration-700 ease-in-out ${
          isOpen ? "opacity-100 visible z-[1500]" : "opacity-0 invisible -z-10"
        }`}
        style={{
          clipPath: isOpen ? "circle(150% at 90% 5%)" : "circle(0% at 90% 5%)",
        }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          {/* Three.js Canvas */}
          <canvas
            id="vtw-three-canvas"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          />

          {/* Navigation Links */}
          <nav
            className="relative z-10"
            role="navigation"
            aria-label="Main navigation"
          >
            <ul className="text-center space-y-8 p-8">
              {/* Main Navigation */}
              {SHARED_NAV_ITEMS.map((item, index) => {
                const isInternal = !isAdminOrStatic(item.href);
                const linkClass = `block text-4xl md:text-6xl font-mono tracking-wider uppercase transition-all duration-300 vtw-hamburger-link ${
                  index % 2 === 0 ? "text-cyan-400" : "text-pink-400"
                } hover:text-white hover:scale-125`;
                const style = {
                  textShadow: "0 0 20px currentColor",
                  WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                  WebkitTextFillColor: "transparent",
                };
                return (
                  <li
                    key={`${item.href}-${item.label}`}
                    className="transform transition-all duration-500 hover:scale-110"
                  >
                    {isInternal ? (
                      <Link
                        to={item.href}
                        className={linkClass}
                        style={style}
                        data-text={item.label
                          .toUpperCase()
                          .replace(/\s+/g, "_")}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(
                            item.href,
                            item.requiresAuth ?? false,
                            e,
                            true
                          );
                        }}
                      >
                        {item.label.toUpperCase().replace(/_/g, " ")}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className={linkClass}
                        style={style}
                        data-text={item.label
                          .toUpperCase()
                          .replace(/\s+/g, "_")}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(
                            item.href,
                            item.requiresAuth ?? false,
                            e,
                            false
                          );
                        }}
                      >
                        {item.label.toUpperCase().replace(/_/g, " ")}
                      </a>
                    )}
                  </li>
                );
              })}

              {/* Admin Access */}
              <li className="pt-8 border-t border-cyan-400/30">
                <button
                  onClick={() =>
                    isAdminAuthenticated
                      ? handleAdminLogout()
                      : setShowAdminPanel(true)
                  }
                  className={`w-full py-4 px-6 text-2xl font-mono tracking-wider uppercase transition-all duration-300 ${
                    isAdminAuthenticated
                      ? "text-red-400 hover:text-red-300 border-red-400/50 hover:border-red-400"
                      : "text-green-400 hover:text-green-300 border-green-400/50 hover:border-green-400"
                  }`}
                  style={{
                    textShadow: `0 0 15px currentColor`,
                    WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {isAdminAuthenticated ? "LOGOUT ADMIN" : "ADMIN ACCESS"}
                </button>
              </li>

              {/* Developer Options */}
              <li className="pt-4">
                <button
                  onClick={handleRevealEverything}
                  className="w-full py-4 px-6 text-2xl font-mono tracking-wider uppercase text-purple-400 hover:text-purple-300 border border-purple-400/50 hover:border-purple-400 transition-all duration-300"
                  style={{
                    textShadow: `0 0 15px currentColor`,
                    WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  REVEAL ALL
                </button>
              </li>

              {/* Close Menu */}
              <li className="pt-8">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 px-6 text-2xl font-mono tracking-wider uppercase text-gray-400 hover:text-gray-300 border border-gray-400/50 hover:border-gray-400 transition-all duration-300"
                  style={{
                    textShadow: `0 0 15px currentColor`,
                    WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  CLOSE MENU
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[2000] flex items-center justify-center">
          <div className="bg-gray-900 border border-cyan-400/50 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-mono text-cyan-400 mb-6 text-center">
              ADMIN ACCESS
            </h2>
            <div className="space-y-4">
              <p className="text-gray-300 text-center mb-6">
                Enter admin access code to unlock administrative features
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    onAdminLogin?.();
                    setShowAdminPanel(false);
                  }}
                  className="py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-mono text-sm uppercase transition-colors"
                >
                  ACCESS GRANTED
                </button>
                <a
                  href="/admin/login.html"
                  className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm uppercase transition-colors rounded text-center flex items-center justify-center"
                >
                  ADMIN LOGIN PAGE
                </a>
              </div>
              <div className="mt-4 flex justify-center">
                <a
                  href="/admin/login.html"
                  className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                >
                  Open Admin Login in new tab
                </a>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Access codes: ADMIN_ACCESS_2024, UNLOCK_ADMIN_123
              </div>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="w-full mt-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm uppercase transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedHamburgerNav;
