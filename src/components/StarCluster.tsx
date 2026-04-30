import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Stars({ scrollY }: { scrollY: number }) {
  const ref = useRef<THREE.Points>(null!);
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(3000 * 3);
    const col = new Float32Array(3000 * 3);
    const colorPalette = [
      new THREE.Color('#4f46e5'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#3b82f6'),
      new THREE.Color('#ffffff')
    ];

    for (let i = 0; i < 3000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, col];
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      // Rotate slowly for depth
      ref.current.rotation.y += delta * 0.08;
      ref.current.rotation.x += delta * 0.04;

      // Dramatically move forward/backward based on scroll
      const targetZ = (scrollY / 500) * 40; 
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, 0.05);
      
      // Add a slight tilt based on scroll speed if possible, or just keep it smooth
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.25}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export const StarCluster = () => {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const container = document.querySelector('.custom-scrollbar');
    const handleScroll = (e: any) => {
      setScrollY(e.target.scrollTop);
    };
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <Stars scrollY={scrollY} />
      </Canvas>
    </div>
  );
};
