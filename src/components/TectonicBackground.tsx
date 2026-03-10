import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 225;
const SIZE = 15;

/**
 * Full-screen Three.js background: instanced hexagonal columns (basalt-style)
 * with cyan/magenta point lights. Used globally across the site.
 */
const TectonicBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    columns: THREE.InstancedMesh;
  } | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
    } catch (_) {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0b,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
    });

    const columns = new THREE.InstancedMesh(geometry, material, COUNT);
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        dummy.position.set((x - SIZE / 2) * 4, -10, (z - SIZE / 2) * 4);
        dummy.updateMatrix();
        columns.setMatrixAt(i++, dummy.matrix);
      }
    }
    scene.add(columns);

    const p1 = new THREE.PointLight(0x00f2ff, 50, 100);
    p1.position.set(20, 20, 20);
    scene.add(p1);

    const p2 = new THREE.PointLight(0xff00ea, 30, 100);
    p2.position.set(-20, 10, -20);
    scene.add(p2);

    sceneRef.current = { scene, camera, renderer, columns };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;
      const data = sceneRef.current;
      const mesh = data?.columns;
      const cam = data?.camera;
      if (!mesh) return;

      const dummy = new THREE.Object3D();
      let idx = 0;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          const wave = Math.sin(t + (x + z) * 0.3) * 2;
          dummy.position.set(
            (x - SIZE / 2) * 4 + mx * 2,
            -12 + wave + my * 5,
            (z - SIZE / 2) * 4
          );
          dummy.rotation.y = t * 0.2;
          dummy.updateMatrix();
          mesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;

      if (cam) {
        cam.position.x += (mx * 10 - cam.position.x) * 0.05;
        cam.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);
      geometry.dispose();
      (material as THREE.Material).dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tectonic-background"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background:
          "radial-gradient(circle at 50% 50%, #151518 0%, #050506 100%)",
      }}
    />
  );
};

export default TectonicBackground;
