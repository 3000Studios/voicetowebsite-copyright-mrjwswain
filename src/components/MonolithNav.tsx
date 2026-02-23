import React, { useEffect, useState } from "react";

interface MonolithNavProps {
  className?: string;
}

const MonolithNav: React.FC<MonolithNavProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (destination: string) => {
    setIsWarping(true);

    // Map destinations to actual routes
    const routes: Record<string, string> = {
      KINETIC: "/features",
      THERMAL: "/the3000",
      VOID: "/demo",
    };

    const targetRoute = routes[destination] || "/";

    // Trigger warp effect then navigate
    setTimeout(() => {
      window.location.href = targetRoute;
    }, 1500);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".monolith-btn") && !target.closest(".nav-list")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <style>{`
        .monolith-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }

        .monolith-btn {
          position: fixed;
          top: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          cursor: pointer;
          z-index: 100;
          pointer-events: all;
          transition: transform 0.3s cubic-bezier(0.85, 0, 0.15, 1);
        }

        .monolith-btn:hover {
          transform: scale(1.1);
        }

        .bar {
          position: absolute;
          width: 40px;
          height: 6px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.6s cubic-bezier(0.85, 0, 0.15, 1);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }

        .bar:nth-child(1) {
          top: 15px;
          animation: jitter 0.4s infinite alternate;
        }

        .bar:nth-child(2) {
          top: 30px;
          animation: jitter 0.5s infinite alternate-reverse;
        }

        .bar:nth-child(3) {
          top: 45px;
          animation: jitter 0.6s infinite alternate;
        }

        @keyframes jitter {
          from {
            transform: translateX(-2px) scaleX(1);
          }
          to {
            transform: translateX(2px) scaleX(1.1);
            filter: drop-shadow(0 0 5px cyan);
          }
        }

        .open .bar {
          width: 4px;
          height: 100vh;
          top: -50vh;
          left: 50%;
          background: #222;
          border: 1px solid #444;
        }

        .open .bar:nth-child(1) {
          left: 20%;
          transition-delay: 0.1s;
        }

        .open .bar:nth-child(2) {
          left: 50%;
          transition-delay: 0.2s;
        }

        .open .bar:nth-child(3) {
          left: 80%;
          transition-delay: 0.3s;
        }

        .nav-list {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 40px;
          z-index: 90;
          background: rgba(17, 17, 17, 0.95);
          backdrop-filter: blur(20px);
        }

        .open + .nav-list {
          display: flex;
        }

        .nav-link {
          font-size: 5vw;
          font-weight: 900;
          -webkit-text-stroke: 1px #fff;
          color: transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.85, 0, 0.15, 1);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          pointer-events: all;
        }

        .nav-link:hover {
          color: #ffd700;
          -webkit-text-stroke: 1px #ffd700;
          filter: drop-shadow(0 0 30px #ffd700);
          transform: scale(1.1) skewX(-10deg);
        }

        .warp-tunnel {
          position: fixed;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(circle, #ffd700, #000);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: all 1.5s cubic-bezier(1, 0, 0, 1);
          z-index: 2000;
        }

        .warp-tunnel.active {
          width: 300vw;
          height: 300vw;
          opacity: 1;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .monolith-btn {
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
          }

          .bar {
            width: 30px;
            height: 5px;
          }

          .bar:nth-child(1) {
            top: 12px;
          }

          .bar:nth-child(2) {
            top: 25px;
          }

          .bar:nth-child(3) {
            top: 38px;
          }

          .nav-link {
            font-size: 8vw;
            gap: 30px;
          }

          .nav-list {
            gap: 30px;
          }
        }

        @media (max-width: 480px) {
          .nav-link {
            font-size: 10vw;
          }

          .nav-list {
            gap: 25px;
          }
        }

        /* High DPI screens */
        @media (min-width: 1400px) {
          .nav-link {
            font-size: 4vw;
          }
        }
      `}</style>

      <div className={`monolith-nav ${className}`}>
        <div
          className={`monolith-btn ${isOpen ? "open" : ""}`}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleToggle();
            }
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen ? "true" : "false"}
        >
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>

        <div className="nav-list">
          <div
            className="nav-link"
            onClick={() => handleNavigation("KINETIC")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleNavigation("KINETIC");
              }
            }}
          >
            KINETIC
          </div>
          <div
            className="nav-link"
            onClick={() => handleNavigation("THERMAL")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleNavigation("THERMAL");
              }
            }}
          >
            THERMAL
          </div>
          <div
            className="nav-link"
            onClick={() => handleNavigation("VOID")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleNavigation("VOID");
              }
            }}
          >
            VOID
          </div>
        </div>

        <div className={`warp-tunnel ${isWarping ? "active" : ""}`} />
      </div>
    </>
  );
};

export default MonolithNav;
