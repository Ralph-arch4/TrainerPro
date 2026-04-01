'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Wireframe dumbbell ─────────────────────────────────────────────────────
function Dumbbell() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.18
  })

  // All cylinder parts share rotation [0,0,π/2] so they lie along the X axis
  const H = [0, 0, Math.PI / 2] as [number, number, number]
  const wf  = (opacity: number, bright = false) => ({
    color: bright ? '#FF9A6C' : '#FF6B2B',
    wireframe: true,
    transparent: true,
    opacity,
  } as const)

  return (
    <Float speed={0.75} floatIntensity={0.28}>
      {/* Slight tilt so it reads as 3-D at rest */}
      <group ref={groupRef} rotation={[0.18, 0, -0.22]}>

        {/* ── Central bar ── */}
        <mesh rotation={H}>
          <cylinderGeometry args={[0.09, 0.09, 2.8, 10, 1]} />
          <meshBasicMaterial {...wf(0.55, true)} />
        </mesh>

        {/* ── Collars (knurled grip section boundaries) ── */}
        {([-1.05, 1.05] as const).map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={H}>
            <cylinderGeometry args={[0.17, 0.17, 0.22, 10, 1]} />
            <meshBasicMaterial {...wf(0.60)} />
          </mesh>
        ))}

        {/* ── Inner weight plates ── */}
        {([-1.32, 1.32] as const).map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={H}>
            <cylinderGeometry args={[0.52, 0.52, 0.18, 12, 1]} />
            <meshBasicMaterial {...wf(0.45)} />
          </mesh>
        ))}

        {/* ── Outer weight plates (larger) ── */}
        {([-1.56, 1.56] as const).map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={H}>
            <cylinderGeometry args={[0.68, 0.68, 0.24, 14, 1]} />
            <meshBasicMaterial {...wf(0.50)} />
          </mesh>
        ))}

        {/* ── End caps ── */}
        {([-1.7, 1.7] as const).map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={H}>
            <cylinderGeometry args={[0.14, 0.14, 0.12, 8, 1]} />
            <meshBasicMaterial {...wf(0.55)} />
          </mesh>
        ))}

        {/* ── Dark fill inside outer plates — depth effect ── */}
        {([-1.56, 1.56] as const).map((x) => (
          <mesh key={`fill-${x}`} position={[x, 0, 0]} rotation={H}>
            <cylinderGeometry args={[0.62, 0.62, 0.20, 14, 1]} />
            <meshBasicMaterial color="#1a0800" transparent opacity={0.55} />
          </mesh>
        ))}

        {/* ── Plate rim rings — decorative detail ── */}
        {([-1.56, 1.56] as const).map((x) => (
          <mesh key={`rim-${x}`} position={[x, 0, 0]}>
            <torusGeometry args={[0.66, 0.028, 4, 40]} />
            <meshBasicMaterial color="#FF9A6C" transparent opacity={0.70} />
          </mesh>
        ))}
        {([-1.32, 1.32] as const).map((x) => (
          <mesh key={`rim2-${x}`} position={[x, 0, 0]}>
            <torusGeometry args={[0.50, 0.022, 4, 32]} />
            <meshBasicMaterial color="#FF9A6C" transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

// ── Orbit ring ─────────────────────────────────────────────────────────────
function OrbitRing({ radius, rotation, speed, opacity = 0.65 }: {
  radius: number; rotation: [number, number, number]; speed: number; opacity?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = state.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, 0.035, 4, 64]} />
      <meshBasicMaterial color="#FF6B2B" transparent opacity={opacity} />
    </mesh>
  )
}

// ── Orange particle field ──────────────────────────────────────────────────
function OrangeParticles({ count = 55 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r     = 3.5 + Math.random() * 4.5
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.random() * Math.PI
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])
  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.032
  })
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FF9A6C" size={0.055} transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

// ── Cyber grid floor ───────────────────────────────────────────────────────
function CyberGrid() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial color="#0a0200" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.38, 0]}>
        <planeGeometry args={[50, 50, 12, 12]} />
        <meshBasicMaterial color="#FF6B2B" wireframe transparent opacity={0.055} />
      </mesh>
    </>
  )
}

export default function HeroScene() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <>
      <Dumbbell />
      <OrbitRing radius={2.9}  rotation={[0.3,  0,    0.1]}  speed={ 0.22}  opacity={0.45} />
      <OrbitRing radius={3.3}  rotation={[-0.5, 0.25, 0.65]} speed={-0.13}  opacity={0.25} />
      <OrbitRing radius={3.8}  rotation={[1.1,  0.4,  0.3]}  speed={ 0.08}  opacity={0.14} />
      <OrangeParticles count={isMobile ? 28 : 55} />
      <CyberGrid />
    </>
  )
}
