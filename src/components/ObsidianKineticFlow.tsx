import React, { useEffect, useRef } from "react";

const ObsidianKineticFlow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const edgeFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply obsidian theme to body
    document.body.classList.add("obsidian-theme");

    // --- PERFORMANCE: THREE.JS BACKGROUND ---
    if (typeof window !== "undefined" && canvasRef.current) {
      const THREE = (window as any).THREE;
      const GSAP = (window as any).gsap;

      if (THREE && GSAP) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(5000 * 3);
        for (let i = 0; i < 5000 * 3; i++) {
          posArray[i] = (Math.random() - 0.5) * 10;
        }
        particlesGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(posArray, 3)
        );
        const material = new THREE.PointsMaterial({
          size: 0.005,
          color: 0x00f2ff,
          transparent: true,
          opacity: 0.5,
        });
        const particlesMesh = new THREE.Points(particlesGeometry, material);
        scene.add(particlesMesh);
        camera.position.z = 3;

        const handleMouseMove = (e: MouseEvent) => {
          const mouseX = e.clientX / window.innerWidth - 0.5;
          const mouseY = e.clientY / window.innerHeight - 0.5;
          GSAP.to(particlesMesh.rotation, {
            y: mouseX * 0.5,
            x: -mouseY * 0.5,
            duration: 2,
          });
        };

        document.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
          requestAnimationFrame(animate);
          particlesMesh.rotation.y += 0.001;
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("resize", handleResize);
          renderer.dispose();
        };
      }
    }

    // --- SENSORY FEEDBACK: SOUNDS ---
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const playSound = (type: "hover" | "click") => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === "hover") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          880,
          audioCtx.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.1
        );
      } else {
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(110, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.2
        );
      }

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    };

    // --- GSAP: ANIMATIONS ---
    if (typeof window !== "undefined") {
      const GSAP = (window as any).gsap;
      const ScrollTrigger = (window as any).ScrollTrigger;

      if (GSAP && ScrollTrigger) {
        GSAP.registerPlugin(ScrollTrigger);

        // Hero Text Animation
        GSAP.to(".obsidian-hero h1 span", {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.05,
          duration: 1,
          ease: "back.out(1.7)",
        });

        GSAP.to("#hero-sub", { opacity: 1, duration: 1, delay: 0.8 });

        // Reveal on Scroll
        GSAP.utils.toArray(".reveal").forEach((elem: Element) => {
          ScrollTrigger.create({
            trigger: elem,
            start: "top 85%",
            onEnter: () =>
              GSAP.to(elem, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power4.out",
              }),
          });
        });

        // Phone Tilt Animation
        const phone = document.getElementById("phone");
        if (phone) {
          window.addEventListener("mousemove", (e: MouseEvent) => {
            const x = (window.innerWidth / 2 - e.pageX) / 20;
            const y = (window.innerHeight / 2 - e.pageY) / 20;
            GSAP.to(phone, { rotationY: -x, rotationX: y, duration: 0.5 });
          });
        }

        // Footer Reveal Effect
        const footer = document.querySelector(".obsidian-footer");
        if (footer) {
          GSAP.from(footer, {
            scrollTrigger: {
              trigger: footer,
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
            },
            y: -100,
            opacity: 0,
          });
        }

        // Card Hover Follow
        document.querySelectorAll(".obsidian-card").forEach((card) => {
          card.addEventListener("mousemove", (e: Event) => {
            const mouseEvent = e as MouseEvent;
            const rect = (card as HTMLElement).getBoundingClientRect();
            const x =
              ((mouseEvent.clientX - rect.left) /
                (card as HTMLElement).clientWidth) *
              100;
            const y =
              ((mouseEvent.clientY - rect.top) /
                (card as HTMLElement).clientHeight) *
              100;
            (card as HTMLElement).style.setProperty("--mouse-x", `${x}%`);
            (card as HTMLElement).style.setProperty("--mouse-y", `${y}%`);
          });
        });
      }
    }

    // --- INTERACTIVE ELEMENTS ---
    // Custom Cursor
    if (cursorRef.current && typeof window !== "undefined") {
      const GSAP = (window as any).gsap;
      if (GSAP) {
        window.addEventListener("mousemove", (e: MouseEvent) => {
          GSAP.to(cursorRef.current, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
          });
        });
      }
    }

    // Click Ripple
    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      ripple.style.left = `${e.clientX - 10}px`;
      ripple.style.top = `${e.clientY - 10}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
      playSound("click");
    };
    window.addEventListener("click", handleClick);

    // Edge Pulse on Scroll
    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      const hue = 180 + scrollPercent * 0.5;
      if (edgeFrameRef.current) {
        edgeFrameRef.current.style.borderColor = `hsla(${hue}, 100%, 50%, 0.5)`;
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Add sound to interactive elements
    document.querySelectorAll("button, a").forEach((element) => {
      element.addEventListener("mouseenter", () => playSound("hover"));
      element.addEventListener("click", () => playSound("click"));
    });

    return () => {
      document.body.classList.remove("obsidian-theme");
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} id="cursor" />
      <div ref={edgeFrameRef} id="edge-frame" />
      <canvas ref={canvasRef} id="bg-canvas" />
    </>
  );
};

export default ObsidianKineticFlow;
