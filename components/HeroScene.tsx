'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Wireframe muscular arm in classic bicep-flex pose ──────────────────────
function MuscularArm() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    // Slow side-to-side sway
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.25
  })

  const wf  = { wireframe: true, transparent: true } as const
  const mat  = (opacity: number, bright = false) => ({
    color: bright ? '#FF9A6C' : '#FF6B2B',
    ...wf, opacity,
  } as const)

  return (
    <Float speed={0.8} floatIntensity={0.3}>
      <group ref={groupRef} position={[0, -0.3, 0]}>

        {/* ── Shoulder cap ── */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.62, 10, 7]} />
          <meshBasicMaterial {...mat(0.50)} />
        </mesh>

        {/* ── Deltoid facets — trapezoid cap over shoulder ── */}
        <mesh position={[0.28, 2.35, 0]} scale={[1.15, 0.7, 0.9]}>
          <sphereGeometry args={[0.5, 8, 5]} />
          <meshBasicMaterial {...mat(0.22, true)} />
        </mesh>

        {/* ── Upper arm — tapered cylinder ── */}
        <mesh position={[0.08, 1.15, 0]}>
          <cylinderGeometry args={[0.44, 0.52, 2.3, 10, 1]} />
          <meshBasicMaterial {...mat(0.45)} />
        </mesh>

        {/* ── Bicep peak — stretched ellipsoid protruding outward ── */}
        <mesh position={[0.52, 1.5, 0.12]} scale={[1.0, 0.82, 0.7]}>
          <sphereGeometry args={[0.6, 10, 7]} />
          <meshBasicMaterial {...mat(0.40, true)} />
        </mesh>

        {/* ── Bicep definition ring ── */}
        <mesh position={[0.22, 1.3, 0]} rotation={[0, 0, 0.08]}>
          <torusGeometry args={[0.53, 0.032, 4, 36]} />
          <meshBasicMaterial color="#FF9A6C" transparent opacity={0.65} />
        </mesh>

        {/* ── Tricep bulge (back of upper arm) ── */}
        <mesh position={[-0.3, 0.9, -0.18]} scale={[0.7, 1.1, 0.65]}>
          <sphereGeometry args={[0.46, 8, 6]} />
          <meshBasicMaterial {...mat(0.28)} />
        </mesh>

        {/* ── Elbow ── */}
        <mesh position={[0.18, 0.02, 0]}>
          <sphereGeometry args={[0.4, 8, 6]} />
          <meshBasicMaterial {...mat(0.42)} />
        </mesh>

        {/* ── Forearm — rotated ~52° toward top-right ── */}
        <mesh position={[0.88, 0.82, 0]} rotation={[0, 0, -Math.PI * 0.29]}>
          <cylinderGeometry args={[0.29, 0.38, 1.85, 9, 1]} />
          <meshBasicMaterial {...mat(0.45)} />
        </mesh>

        {/* ── Forearm muscle band ── */}
        <mesh position={[0.62, 0.48, 0]} rotation={[0, 0, -Math.PI * 0.29]}>
          <torusGeometry args={[0.36, 0.028, 4, 28]} />
          <meshBasicMaterial color="#FF9A6C" transparent opacity={0.55} />
        </mesh>

        {/* ── Wrist / clenched fist ── */}
        <mesh position={[1.58, 1.58, 0]}>
          <sphereGeometry args={[0.44, 9, 6]} />
          <meshBasicMaterial {...mat(0.48)} />
        </mesh>

        {/* ── Knuckle band across fist ── */}
        <mesh position={[1.58, 1.62, 0]} rotation={[0, 0, Math.PI * 0.5]}>
          <torusGeometry args={[0.3, 0.028, 4, 24]} />
          <meshBasicMaterial color="#FF9A6C" transparent opacity={0.55} />
        </mesh>

        {/* ── Dark interior fill — gives depth to upper arm ── */}
        <mesh position={[0.08, 1.15, 0]}>
          <cylinderGeometry args={[0.38, 0.46, 2.1, 10, 1]} />
          <meshBasicMaterial color="#1a0800" transparent opacity={0.55} />
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
      <MuscularArm />
      <OrbitRing radius={2.8}  rotation={[0.3,  0,    0.1]}  speed={ 0.22}  opacity={0.5} />
      <OrbitRing radius={3.2}  rotation={[-0.5, 0.25, 0.65]} speed={-0.13}  opacity={0.28} />
      <OrbitRing radius={3.7}  rotation={[1.1,  0.4,  0.3]}  speed={ 0.08}  opacity={0.15} />
      <OrangeParticles count={isMobile ? 28 : 55} />
      <CyberGrid />
    </>
  )
}
