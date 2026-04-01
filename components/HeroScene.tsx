'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Layered wireframe globe — orange fitness CRM theme ─────────────────────
function FitnessGlobe() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12
    groupRef.current.rotation.x = state.clock.elapsedTime * 0.035
  })
  return (
    <Float speed={0.9} floatIntensity={0.35}>
      <group ref={groupRef}>
        {/* Outer shell */}
        <mesh>
          <sphereGeometry args={[2, 16, 10]} />
          <meshBasicMaterial color="#FF6B2B" wireframe transparent opacity={0.32} />
        </mesh>
        {/* Dark interior — creates depth */}
        <mesh>
          <sphereGeometry args={[1.82, 12, 8]} />
          <meshBasicMaterial color="#1a0800" transparent opacity={0.6} />
        </mesh>
        {/* Inner bright lattice */}
        <mesh>
          <sphereGeometry args={[1.1, 10, 6]} />
          <meshBasicMaterial color="#FF9A6C" wireframe transparent opacity={0.14} />
        </mesh>
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
      <FitnessGlobe />
      <OrbitRing radius={2.7}  rotation={[0.3,  0,    0.1]}  speed={ 0.25}  opacity={0.6} />
      <OrbitRing radius={3.1}  rotation={[-0.5, 0.25, 0.65]} speed={-0.15}  opacity={0.35} />
      <OrbitRing radius={3.55} rotation={[1.1,  0.4,  0.3]}  speed={ 0.09}  opacity={0.18} />
      <OrangeParticles count={isMobile ? 28 : 55} />
      <CyberGrid />
    </>
  )
}
