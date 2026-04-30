import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

function Scene() {
  const blockRef = useRef<RapierRigidBody>(null);
  const { viewport } = useThree();

  // Move the block with the mouse
  useFrame((state) => {
    if (blockRef.current) {
      blockRef.current.setNextKinematicTranslation({
        x: (state.mouse.x * viewport.width) / 2,
        y: (state.mouse.y * viewport.height) / 2,
        z: 0
      });
    }
  });

  const balls = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 10,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 5
      ] as [number, number, number],
      color: i % 2 === 0 ? "#6366f1" : "#4f46e5"
    }));
  }, []);

  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* The Moving Block */}
      <RigidBody ref={blockRef} type="kinematicPosition" colliders="cuboid">
        <mesh>
          <boxGeometry args={[4, 0.5, 2]} />
          <meshStandardMaterial color="#222" transparent opacity={0.8} />
        </mesh>
      </RigidBody>

      {/* The Balls */}
      {balls.map((ball) => (
        <RigidBody 
          key={ball.id} 
          colliders="ball" 
          position={ball.position} 
          restitution={1.2}
          linearDamping={0.5}
          angularDamping={0.5}
        >
          <mesh>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial 
              color={ball.color} 
              emissive={ball.color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </RigidBody>
      ))}

      {/* Constraints to keep balls in view */}
      <RigidBody type="fixed" position={[0, -viewport.height / 2 - 1, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[viewport.width * 2, 1, 10]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-viewport.width / 2 - 1, 0, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[1, viewport.height * 2, 10]} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[viewport.width / 2 + 1, 0, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[1, viewport.height * 2, 10]} />
        </mesh>
      </RigidBody>

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
    </Physics>
  );
}

export const PhysicsBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[#020205]" />
      
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 50 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }}
      >
        <Scene />
      </Canvas>

      {/* SVG Mask Layer provided by user */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="grid-mask">
              <rect fill="white" width="100" height="100" />
              <rect x="10" y="10" width="20" height="20" fill="black" rx="2" />
              <rect x="70" y="20" width="15" height="15" fill="black" rx="2" />
              <rect x="40" y="60" width="25" height="25" fill="black" rx="2" />
              <rect x="15" y="75" width="10" height="10" fill="black" rx="2" />
            </mask>
          </defs>
          <rect 
            className="fill-[#020205]/95" 
            width="100" 
            height="100" 
            mask="url(#grid-mask)" 
          />
        </svg>
      </div>

      {/* Noise and Grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
