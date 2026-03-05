import React, { useEffect, useRef, useState } from "react";
import { SHARED_NAV_ITEMS } from "../constants/navigation";

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
    requiresAuth = false,
    e?: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (requiresAuth && !isAdminAuthenticated) {
      // Show admin access code prompt
      const code = prompt("Enter admin access code:");
      if (code === "ADMIN_ACCESS_2024" || code === "UNLOCK_ADMIN_123") {
        onAdminLogin?.();
        setShowAdminPanel(true);
      } else if (code) {
        alert("Invalid access code");
      }
      return;
    }

    // Play sizzle and melt effect
    playSizzle();

    // Add melt effect to clicked link
    const target = e?.currentTarget as HTMLElement;
    if (target) {
      target.classList.add("vtw-phosphor-melting");
      setTimeout(() => {
        target.classList.remove("vtw-phosphor-melting");
        window.location.href = href;
      }, 800);
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

      {/* Hamburger Menu */}
      <div className="fixed top-6 right-6 z-[2000] flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-[2001] group"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity">
              Voicetowebsite.com
            </span>
            <div className="relative">
              <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-400 group-hover:from-pink-400 group-hover:to-cyan-400 transition-all duration-300" />
              <div className="absolute inset-0 flex flex-col justify-between">
                <div className="w-0.5 h-3 bg-cyan-400 group-hover:bg-pink-400 transition-all duration-300 origin-top" />
                <div className="w-0.5 h-3 bg-cyan-400 group-hover:bg-pink-400 transition-all duration-300 origin-bottom" />
              </div>
            </div>
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
              {SHARED_NAV_ITEMS.map((item, index) => (
                <li
                  key={item.label}
                  className="transform transition-all duration-500 hover:scale-110"
                >
                  <a
                    href={item.href}
                    className={`block text-4xl md:text-6xl font-mono tracking-wider uppercase transition-all duration-300 ${
                      index % 2 === 0 ? "text-cyan-400" : "text-pink-400"
                    } hover:text-white hover:scale-125`}
                    style={{
                      textShadow: `0 0 20px currentColor`,
                      WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                      WebkitTextFillColor: "transparent",
                    }}
                    data-text={item.label.toUpperCase().replace(/\s+/g, "_")}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      handleNavClick(item.href, item.requiresAuth || false);
                    }}
                  >
                    {item.label.toUpperCase().replace(/_/g, " ")}
                  </a>
                </li>
              ))}

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
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-mono text-sm uppercase transition-colors"
                >
                  CANCEL
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Access codes: ADMIN_ACCESS_2024, UNLOCK_ADMIN_123
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedHamburgerNav;
