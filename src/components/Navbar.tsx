import { GOOGLE_AI_STUDIO_APP_URL } from "@/constants/integrations";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Features", href: "/features" },
  { label: "Examples", href: "/examples" },
  { label: "Pricing", href: "/pricing" },
  { label: "AI Studio", href: GOOGLE_AI_STUDIO_APP_URL },
  { label: "Blog", href: "/blog" },
  { label: "Stories", href: "/stories" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Legal", href: "/legal" },
  { label: "Sign In", href: "/login" },
  { label: "Sign Up", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Admin", href: "/admin" },
];

const MoltenNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ripples, setRipples] = useState<
    { id: string; x: number; y: number }[]
  >([]);
  const lastScrollTop = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Hide/show on scroll
      if (scrollTop > lastScrollTop.current && scrollTop > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      // Change style when scrolled
      setIsScrolled(scrollTop > 20);
      lastScrollTop.current = scrollTop;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("http")) {
      setIsOpen(false);
      document.body.style.overflow = "auto";
      return;
    }

    e.preventDefault();

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const id = Date.now().toString();

    setRipples((prev) => [...prev, { id, x, y }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1000);

    // Navigate after animation
    setTimeout(() => {
      setIsOpen(false);
      document.body.style.overflow = "auto";
      window.location.href = href;
    }, 400);
  };

  return (
    <>
      {/* Navigation Header */}
      <nav
        className={`fixed top-0 left-0 w-full h-20 flex justify-between items-center px-8 z-1000 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHidden ? "-translate-y-full" : "translate-y-0"
        } ${
          isScrolled
            ? "bg-black/40 backdrop-blur-lg"
            : "bg-black/20 backdrop-blur-md"
        }`}
      >
        <Link
          to="/"
          className="logo font-outfit font-bold text-lg uppercase tracking-tight font-space-mono bg-linear-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent transition hover:scale-[1.02]"
          aria-label="VoiceToWebsite.com home"
        >
          VoiceToWebsite.com
        </Link>

        {/* Hamburger Icon */}
        <button
          onClick={handleMenuClick}
          className={`ham-trigger w-10 h-10 relative z-1001 flex flex-col justify-center gap-1.5 cursor-pointer ${
            isOpen ? "active" : ""
          }`}
          aria-label="Toggle menu"
        >
          <span className="ham-line block w-full h-0.5 bg-white rounded-full transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]" />
          <span className="ham-line block w-full h-0.5 bg-white rounded-full transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]" />
          <span className="ham-line block w-full h-0.5 bg-white rounded-full transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]" />
        </button>
      </nav>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, visibility: "hidden" }}
            animate={{ opacity: 1, visibility: "visible" }}
            exit={{ opacity: 0, visibility: "hidden" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black z-999 flex items-center justify-center overflow-y-auto"
          >
            {/* 3D Animated Background */}
            <div className="absolute inset-0 opacity-60">
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/20 via-cyan-500/20 to-orange-600/20 animate-pulse" />
              <div className="absolute inset-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 border border-white/10 rounded-full scale-150 animate-spin"
                    style={{
                      animationDuration: `${20 + i * 10}s`,
                      animationDirection: i % 2 === 0 ? "normal" : "reverse",
                      opacity: 0.1 + i * 0.05,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stratigraphy Label */}
            <div className="absolute bottom-10 left-10 hidden font-space-mono text-xs text-cyan-400 uppercase tracking-widest opacity-50 md:block">
              VoiceToWebsite.com launch menu
            </div>

            {/* Menu Links */}
            <ul className="menu-links relative z-10 grid max-h-screen w-full max-w-6xl list-none gap-3 overflow-y-auto p-5 py-24 text-center md:grid-cols-2 md:gap-x-10 md:gap-y-4">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.08 + index * 0.035,
                    duration: 0.45,
                    ease: [0.19, 1, 0.22, 1],
                  }}
                  className="menu-item relative overflow-visible"
                >
                  {item.href.startsWith("http") ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => handleLinkClick(e, item.href)}
                      className="menu-link relative block text-3xl font-black uppercase text-transparent stroke-white/30 stroke-1 transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-white hover:stroke-0 hover:tracking-[0.08em] sm:text-4xl lg:text-5xl"
                    >
                      {item.label}
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <span className="w-[110%] h-5 bg-repeating-linear-gradient-90 from-cyan-400 from-0 to-transparent to-2 animate-wave" />
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={(e) => handleLinkClick(e, item.href)}
                      className="menu-link relative block text-3xl font-black uppercase text-transparent stroke-white/30 stroke-1 transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-white hover:stroke-0 hover:tracking-[0.08em] sm:text-4xl lg:text-5xl"
                    >
                      {item.label}
                      {/* Hover Sound Wave Animation */}
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <span className="w-[110%] h-5 bg-repeating-linear-gradient-90 from-cyan-400 from-0 to-transparent to-2 animate-wave" />
                      </span>
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>

            {/* Ripple Effects */}
            {ripples.map((ripple) => (
              <div
                key={ripple.id}
                className="frequency-bar fixed bottom-0 left-0 w-full h-full bg-white mix-blend-difference pointer-events-none"
                style={{
                  clipPath: `circle(0% at ${ripple.x}px ${ripple.y}px)`,
                  animation: "rippleExpand 1s ease-out forwards",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ham-line {
          animation: colorShift 4s infinite alternate;
        }

        .ham-line:nth-child(2) {
          animation-delay: 0.5s;
        }

        .ham-line:nth-child(3) {
          animation-delay: 1s;
        }

        .ham-trigger.active .ham-line:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
          animation: none;
          background: white;
        }

        .ham-trigger.active .ham-line:nth-child(2) {
          opacity: 0;
        }

        .ham-trigger.active .ham-line:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
          animation: none;
          background: white;
        }

        @keyframes colorShift {
          0% {
            background: #00f2ff;
            transform: scaleX(0.8);
          }
          50% {
            background: #ff3c00;
            transform: scaleX(1);
          }
          100% {
            background: #7000ff;
            transform: scaleX(0.9);
          }
        }

        @keyframes wave {
          0% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(2.5);
            filter: hue-rotate(90deg);
          }
          100% {
            transform: scaleY(1);
          }
        }

        @keyframes rippleExpand {
          0% {
            clip-path: circle(0% at var(--x) var(--y));
            background-color: #00f2ff;
          }
          50% {
            clip-path: circle(100% at var(--x) var(--y));
            background-color: #00f2ff;
          }
          100% {
            clip-path: circle(100% at var(--x) var(--y));
            opacity: 0;
          }
        }

        .animate-wave {
          animation: wave 0.4s steps(4) infinite;
        }

        .font-outfit {
          font-family: "Outfit", sans-serif;
        }

        .font-space-mono {
          font-family: "Space Mono", monospace;
        }

        .bg-repeating-linear-gradient-90 {
          background-image: repeating-linear-gradient(
            90deg,
            #00f2ff 0px,
            #00f2ff 2px,
            transparent 2px,
            transparent 8px
          );
        }

        .stroke-white\/30 {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.3);
        }

        .stroke-0 {
          -webkit-text-stroke: 0px;
        }

        .stroke-1 {
          -webkit-text-stroke: 1px;
        }
      `}</style>
    </>
  );
};

export const Navbar = MoltenNav;
