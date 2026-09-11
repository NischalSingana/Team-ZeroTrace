'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

// A simple deterministic random generator for the sphere
function inSphere(buffer: Float32Array, radius: number) {
  for (let i = 0; i < buffer.length; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);
    buffer[i] = r * sinPhi * Math.cos(theta);
    buffer[i + 1] = r * sinPhi * Math.sin(theta);
    buffer[i + 2] = r * Math.cos(phi);
  }
  return buffer;
}

function ParticleSwarm(props: any) {
  const ref = useRef<any>(null);
  
  const sphere = useMemo(() => {
    const data = new Float32Array(5000 * 3);
    return inSphere(data, 1.5);
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 bg-[#050709]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleSwarm />
      </Canvas>
    </div>
  );
}
