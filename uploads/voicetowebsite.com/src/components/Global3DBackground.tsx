import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

const SynthGrid = () => {
  const gridRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (gridRef.current) {
      gridRef.current.position.z = (t * 2) % 2;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <gridHelper args={[100, 50, "#6366f1", "#1e1b4b"]} ref={gridRef as any} />
    </group>
  );
};

const FloatingMicrophone = ({ position, speed, rotationSpeed }: any) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.5;
      meshRef.current.rotation.y += rotationSpeed;
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Simplified Microphone Mesh */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 32]} />
        <meshStandardMaterial color="#333" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#888" roughness={0} metalness={1} wireframe />
      </mesh>
      {/* Light glow */}
      <pointLight color="#6366f1" intensity={0.5} distance={3} />
    </group>
  );
};

const Waves = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      // access buffer geometry and update positions for a wave effect
      // instead using MeshDistortMaterial for simplicity and performance
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, -10]}>
      <planeGeometry args={[100, 100, 64, 64]} />
      <MeshDistortMaterial
        color="#0a0a0a"
        speed={1}
        distort={0.4}
        radius={1}
      />
    </mesh>
  );
};

const Scene = () => {
  const mics = useMemo(() => {
    return [...Array(8)].map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        Math.random() * 5 + 2,
        -Math.random() * 15 - 5
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 1,
      rotationSpeed: 0.005 + Math.random() * 0.01
    }));
  }, []);

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 5, 25]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
      <spotLight position={[-10, 10, 10]} angle={0.2} penumbra={1} intensity={1} color="#a855f7" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <SynthGrid />
      <Waves />
      
      {mics.map((mic, i) => (
        <FloatingMicrophone key={i} {...mic} />
      ))}
    </>
  );
};

export const Global3DBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />
        <Scene />
      </Canvas>
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />
    </div>
  );
};
