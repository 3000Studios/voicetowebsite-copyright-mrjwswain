import React, { useEffect, useRef, useState } from "react";
import { SHARED_NAV_ITEMS } from "../constants/navigation";

declare global {
  interface Window {
    THREE?: typeof import("three");
  }
}

const THREE_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(): Promise<typeof import("three")> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("no window"));
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = THREE_CDN;
    script.onload = () => resolve(window.THREE!);
    script.onerror = () => reject(new Error("Three.js failed to load"));
    document.head.appendChild(script);
  });
}

export default function PhosphorNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeInitialized = useRef(false);
  const threeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !menuOpen || threeInitialized.current) return;
    let cancelled = false;
    loadThree()
      .then((THREE) => {
        if (cancelled || threeInitialized.current) return;
        threeInitialized.current = true;
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 5;
        const geometries = [
          new THREE.IcosahedronGeometry(1, 0),
          new THREE.TorusKnotGeometry(0.7, 0.3, 100, 16),
          new THREE.OctahedronGeometry(1, 0),
        ];
        const objects: import("three").Mesh[] = [];
        for (let i = 0; i < 15; i++) {
          const material = new THREE.MeshPhysicalMaterial({
            color: i % 2 === 0 ? 0xff00ff : 0x00ffff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: i % 2 === 0 ? 0x220022 : 0x002222,
            transparent: true,
            opacity: 0.8,
          });
          const mesh = new THREE.Mesh(
            geometries[Math.floor(Math.random() * geometries.length)],
            material
          );
          mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5
          );
          mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0
          );
          scene.add(mesh);
          objects.push(mesh);
        }
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        let mouseX = 0,
          mouseY = 0,
          targetX = 0,
          targetY = 0;
        const onMouseMove = (e: MouseEvent) => {
          mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("resize", onResize);
        renderer.setSize(window.innerWidth, window.innerHeight);

        let rafId: number;
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          targetX += (mouseX - targetX) * 0.05;
          targetY += (mouseY - targetY) * 0.05;
          objects.forEach((obj, i) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
            obj.position.x += Math.sin(Date.now() * 0.001 + i) * 0.005;
            obj.position.z = 2 + targetY * 2 + Math.cos(Date.now() * 0.001 + i);
          });
          camera.position.x += (targetX - camera.position.x) * 0.05;
          camera.position.y += (-targetY - camera.position.y) * 0.05;
          camera.lookAt(scene.position);
          renderer.render(scene, camera);
        };
        animate();
        threeCleanupRef.current = () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("resize", onResize);
          threeInitialized.current = false;
          threeCleanupRef.current = null;
        };
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (threeCleanupRef.current) {
        threeCleanupRef.current();
      }
    };
  }, [menuOpen]);

  const playSizzle = () => {
    try {
      const audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const bufferSize = audioCtx.sampleRate * 1.5;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
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
    } catch (_) {
      /* no-op */
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href");
    if (!href || href === "#") return;
    e.preventDefault();
    playSizzle();
    e.currentTarget.classList.add("vtw-phosphor-melting");
    setTimeout(() => {
      window.location.href = href;
    }, 800);
  };

  return (
    <>
      <div className="vtw-crt-overlay" aria-hidden="true" />
      <div className="vtw-grain" aria-hidden="true" />
      <button
        type="button"
        id="vtwPhosphorTrigger"
        className={`vtw-phosphor-trigger ${menuOpen ? "active" : ""}`}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="vtwPhosphorMenu"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="vtw-phosphor-logo-text">Voicetowebsite.com</span>
        <div className="vtw-phosphor-burger-icon">
          <span className="vtw-phosphor-burger-line" />
          <span className="vtw-phosphor-burger-line" />
          <span className="vtw-phosphor-burger-line" />
        </div>
      </button>
      <nav
        ref={menuRef}
        id="vtwPhosphorMenu"
        className={`vtw-phosphor-menu ${menuOpen ? "open" : ""}`}
        aria-label="Main navigation"
        role="navigation"
        hidden={!menuOpen}
      >
        <canvas
          ref={canvasRef}
          id="vtw-three-canvas"
          className="vtw-phosphor-three-canvas"
          aria-hidden="true"
        />
        <ul className="vtw-phosphor-nav-links">
          {SHARED_NAV_ITEMS.map((item) => (
            <li key={item.label} className="vtw-phosphor-nav-item">
              <a
                href={item.href}
                className="vtw-phosphor-nav-link"
                data-text={item.label.toUpperCase().replace(/\s+/g, "_")}
                onClick={handleLinkClick}
              >
                {item.label.toUpperCase().replace(/_/g, " ")}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
