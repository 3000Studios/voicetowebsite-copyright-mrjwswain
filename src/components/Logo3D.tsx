import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial, Sphere, Torus, Box, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Mic2, Globe, Layout } from 'lucide-react';

const LogoMesh = () => {
  const globeRef = useRef<THREE.Mesh>(null);
  const micRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.5;
    }
    if (micRef.current) {
      micRef.current.position.y = Math.sin(t * 2) * 0.2;
      micRef.current.rotation.z = Math.sin(t) * 0.1;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        {/* Globe-like Sphere */}
        <Sphere args={[1.2, 32, 32]} ref={globeRef}>
          <meshPhongMaterial
            color="#6366f1"
            wireframe
            transparent
            opacity={0.3}
          />
        </Sphere>
        
        {/* Inner Core */}
        <Sphere args={[0.8, 32, 32]}>
          <MeshDistortMaterial
            color="#4f46e5"
            speed={2}
            distort={0.3}
          />
        </Sphere>

        {/* Microphone Group */}
        <group ref={micRef} position={[0, 0, 1.5]}>
          <Html center>
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                <Mic2 className="text-white" size={32} />
              </div>
              <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                Voice Link
              </div>
            </div>
          </Html>
        </group>

        {/* Orbiting Website Icons */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <group position={[2.5, Math.sin(i) * 0.5, 0]}>
              <Html center>
                <div className="w-8 h-8 bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl">
                  <Layout className="text-indigo-400" size={16} />
                </div>
              </Html>
            </group>
          </group>
        ))}
      </Float>
    </group>
  );
};

export const Logo3D = ({ className }: { className?: string }) => {
  return (
    <div className={`${className} w-full h-full`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        <LogoMesh />
      </Canvas>
    </div>
  );
};
