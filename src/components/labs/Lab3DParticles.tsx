import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ORB_COLORS = ["#8b5cf6", "#6366f1", "#06b6d4", "#10b981", "#a78bfa", "#34d399", "#60a5fa"];

function Orb({
  position,
  color,
  speed,
  size,
  phase,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  size: number;
  phase: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime * speed + phase;
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.55;
    meshRef.current.position.x = position[0] + Math.cos(t * 0.65) * 0.3;
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.x = t * 0.25;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 14, 14]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        transparent
        opacity={0.5}
        roughness={0.15}
        metalness={0.85}
      />
    </mesh>
  );
}

function Scene() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 11,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 2.5 - 0.5,
        ] as [number, number, number],
        color: ORB_COLORS[i % ORB_COLORS.length],
        speed: 0.22 + Math.random() * 0.32,
        size: 0.07 + Math.random() * 0.24,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 5, 4]} intensity={2.5} color="#8b5cf6" />
      <pointLight position={[-4, -3, 3]} intensity={2} color="#06b6d4" />
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
    </>
  );
}

export default function Lab3DParticles() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
