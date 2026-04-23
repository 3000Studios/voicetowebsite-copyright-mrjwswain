import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const StarField = () => {
  const starsRef = useRef<THREE.Points>(null);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPos(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      // Move stars forward/backward based on scroll velocity
      starsRef.current.position.z = (scrollPos * 0.05) % 100;
      starsRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Stars 
      ref={starsRef}
      radius={100} 
      depth={50} 
      count={5000} 
      factor={4} 
      saturation={0} 
      fade 
      speed={1} 
    />
  );
};

const SynthObject = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [color, setColor] = useState(new THREE.Color('#6366f1'));

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      
      // Random color shifting when "still" (simulated by time)
      const t = state.clock.getElapsedTime();
      if (Math.sin(t) > 0.9) {
        setColor(new THREE.Color().setHSL(Math.random(), 0.7, 0.6));
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.4} 
        wireframe 
        emissive={color}
        emissiveIntensity={1}
      />
    </mesh>
  );
};

const WirelessMicGlobe = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -20]}>
      {/* Globe Wireframe */}
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          wireframe 
          transparent 
          opacity={0.1} 
        />
      </mesh>
      
      {/* 3D Mic (Simplified as primitive group) */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[0.5, 0.4, 4, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#555" wireframe />
        </mesh>
      </group>
    </group>
  );
};

export const SynthWaveBackground = () => {
  const synthObjects = useMemo(() => {
    return Array.from({ length: 20 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      ] as [number, number, number]
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute inset-0 bg-[#020205]" />
      
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <StarField />
        
        {synthObjects.map((obj, i) => (
          <SynthObject key={i} position={obj.position} />
        ))}
        
        <WirelessMicGlobe />
      </Canvas>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
