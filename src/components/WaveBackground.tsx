import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const Wave = () => {
  const meshRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  const count = 60;
  const sep = 0.5;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * count * 3);
    const cols = new Float32Array(count * count * 3);
    const color = new THREE.Color();
    for (let x = 0; x < count; x++) {
      for (let z = 0; z < count; z++) {
        const i = (x * count + z) * 3;
        pos[i] = (x - count / 2) * sep;
        pos[i + 1] = 0;
        pos[i + 2] = (z - count / 2) * sep;

        color.setHSL((x / count) * 0.2 + 0.5, 0.8, 0.5);
        cols[i] = color.r;
        cols[i + 1] = color.g;
        cols[i + 2] = color.b;
      }
    }
    return [pos, cols];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const pos = meshRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let x = 0; x < count; x++) {
        for (let z = 0; z < count; z++) {
          const i = (x * count + z) * 3;
          const xPos = pos[i];
          const zPos = pos[i + 2];

          // Wave logic + mouse reaction
          const dist = Math.sqrt(xPos * xPos + zPos * zPos);
          const mouseDist = Math.sqrt(
            Math.pow(xPos - mouse.x * 15, 2) + Math.pow(zPos + mouse.y * 15, 2),
          );
          const wave = Math.sin(dist * 0.5 - t * 2) * 0.5;
          const mouseWave = Math.exp(-mouseDist * 0.3) * 3;

          pos[i + 1] = wave + mouseWave;
        }
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
};

export const WaveBackground = () => {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none">
      <Canvas camera={{ position: [0, 15, 25], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Wave />
      </Canvas>
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/20 to-slate-950" />
    </div>
  );
};
