import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Static rotation
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;

      if (hovered) {
        // Wiggle effect (using noise or simple sine)
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.1;
        meshRef.current.position.x = Math.cos(state.clock.elapsedTime * 10) * 0.1;
      } else {
        meshRef.current.position.y = 0;
        meshRef.current.position.x = 0;
      }
    }
  });

  return (
    <Sphere 
      ref={meshRef} 
      args={[1, 32, 32]} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial 
        wireframe 
        color={hovered ? "#818cf8" : "#4f46e5"} 
        emissive={hovered ? "#818cf8" : "#4f46e5"}
        emissiveIntensity={hovered ? 2 : 0.5}
        transparent
        opacity={0.6}
      />
    </Sphere>
  );
}

export const NeuralGlobe = () => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Globe />
      </Canvas>
    </div>
  );
};
