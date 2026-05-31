'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Gold palette (meshBasicMaterial — no lighting dependency, pure glow) ───
const GOLD      = new THREE.Color('#C9A84C')
const GOLD_LITE = new THREE.Color('#E8C96B')
const GOLD_DIM  = new THREE.Color('#8B6820')

// ── 1 400-particle gold cloud ──────────────────────────────────────────────
function GoldParticles() {
  const mesh = useRef<THREE.Points>(null)

  const { positions, colors, sizes } = useMemo(() => {
    const count = 1400
    const pos  = new Float32Array(count * 3)
    const col  = new Float32Array(count * 3)
    const sz   = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Mix: 60% Fibonacci sphere shell, 40% volumetric scatter
      if (i < count * 0.6) {
        const phi   = Math.acos(1 - 2 * (i + 0.5) / (count * 0.6))
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        const r     = 2.4 + (Math.random() - 0.5) * 1.6
        pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        pos[i * 3 + 2] = r * Math.cos(phi)
      } else {
        // Volumetric cloud around centre — adds depth
        const r = 0.6 + Math.random() * 2.8
        const u = Math.random() * 2 * Math.PI
        const v = Math.acos(2 * Math.random() - 1)
        pos[i * 3]     = r * Math.sin(v) * Math.cos(u)
        pos[i * 3 + 1] = r * Math.sin(v) * Math.sin(u)
        pos[i * 3 + 2] = r * Math.cos(v)
      }

      // Colour varies by distance from centre for depth cue
      const dist = Math.sqrt(pos[i*3]**2 + pos[i*3+1]**2 + pos[i*3+2]**2)
      const c = dist < 1.5 ? GOLD_LITE : (dist < 2.5 ? GOLD : GOLD_DIM)
      col[i * 3]     = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
      sz[i] = dist < 2 ? 0.028 : 0.018
    }
    return { positions: pos, colors: col, sizes: sz }
  }, [])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.y = t * 0.05
    mesh.current.rotation.x = Math.sin(t * 0.017) * 0.18
    // Gentle breathing
    const s = 1 + Math.sin(t * 0.4) * 0.015
    mesh.current.scale.setScalar(s)
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        vertexColors
        transparent
        opacity={0.70}
        sizeAttenuation
      />
    </points>
  )
}

// ── Central gold orb — solid core + wireframe icosahedron shell ────────────
function GoldOrb() {
  const wire  = useRef<THREE.Mesh>(null)
  const wire2 = useRef<THREE.Mesh>(null)
  const core  = useRef<THREE.Mesh>(null)

  const coreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD,      transparent: true, opacity: 0.90 }), [])
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD_LITE, wireframe: true, transparent: true, opacity: 0.30 }), [])
  const wireMat2 = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD,     wireframe: true, transparent: true, opacity: 0.14 }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (wire.current)  { wire.current.rotation.y  = t * 0.28; wire.current.rotation.z  = t * 0.12 }
    if (wire2.current) { wire2.current.rotation.y = -t * 0.18; wire2.current.rotation.x = t * 0.09 }
    if (core.current) {
      const s = 1 + Math.sin(t * 1.1) * 0.06
      core.current.scale.setScalar(s)
    }
  })

  return (
    <group>
      {/* Pulsing solid core */}
      <mesh ref={core} material={coreMat}>
        <sphereGeometry args={[0.22, 32, 32]} />
      </mesh>
      {/* Wireframe icosahedron shell */}
      <mesh ref={wire} material={wireMat}>
        <icosahedronGeometry args={[0.72, 1]} />
      </mesh>
      {/* Outer wireframe dodecahedron */}
      <mesh ref={wire2} material={wireMat2}>
        <dodecahedronGeometry args={[1.05, 0]} />
      </mesh>
    </group>
  )
}

// ── Three orbital gold rings ───────────────────────────────────────────────
function OrbitalRings() {
  const r1 = useRef<THREE.Mesh>(null)
  const r2 = useRef<THREE.Mesh>(null)
  const r3 = useRef<THREE.Mesh>(null)

  const m1 = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD_LITE, transparent: true, opacity: 0.55 }), [])
  const m2 = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD,      transparent: true, opacity: 0.35 }), [])
  const m3 = useMemo(() => new THREE.MeshBasicMaterial({ color: GOLD_DIM,  transparent: true, opacity: 0.22 }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (r1.current) { r1.current.rotation.z = t * 0.22;  r1.current.rotation.x = t * 0.08 }
    if (r2.current) { r2.current.rotation.z = -t * 0.15; r2.current.rotation.y = t * 0.11 }
    if (r3.current) { r3.current.rotation.x = t * 0.18;  r3.current.rotation.z = t * 0.06 }
  })

  return (
    <>
      <mesh ref={r1} rotation={[Math.PI / 2.4, 0, 0]} material={m1}>
        <torusGeometry args={[1.85, 0.018, 8, 128]} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 6, Math.PI / 5, 0]} material={m2}>
        <torusGeometry args={[2.40, 0.012, 8, 128]} />
      </mesh>
      <mesh ref={r3} rotation={[0, 0, Math.PI / 3]} material={m3}>
        <torusGeometry args={[1.30, 0.020, 8, 96]} />
      </mesh>
    </>
  )
}

// ── Six floating data nodes — pulsing gold spheres ─────────────────────────
function DataNodes() {
  const groupRef = useRef<THREE.Group>(null)
  const matsRef  = useRef<THREE.MeshBasicMaterial[]>([])

  const positions: [number,number,number][] = useMemo(() => [
    [ 1.45,  1.25, 0.6], [-1.55,  0.85, 0.4],
    [ 0.85, -1.65, 0.8], [-0.95, -1.25, 1.0],
    [ 1.85, -0.45, 0.2], [-1.75,  0.15, 0.5],
  ], [])

  const colors = [GOLD_LITE, GOLD, GOLD_LITE, GOLD, GOLD_LITE, GOLD]

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) groupRef.current.rotation.y = t * 0.08
    matsRef.current.forEach((m, i) => {
      m.opacity = 0.55 + Math.sin(t * 1.8 + i * 1.1) * 0.35
    })
  })

  const geo = useMemo(() => new THREE.SphereGeometry(0.07, 12, 12), [])

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => {
        if (!matsRef.current[i]) {
          matsRef.current[i] = new THREE.MeshBasicMaterial({
            color: colors[i], transparent: true, opacity: 0.7,
          })
        }
        return (
          <mesh key={i} geometry={geo} material={matsRef.current[i]} position={pos} />
        )
      })}
    </group>
  )
}

// ── Connector lines from orb to nodes ─────────────────────────────────────
function ConnectorLines() {
  const nodePositions: [number,number,number][] = [
    [ 1.45, 1.25, 0.6], [-1.55, 0.85, 0.4],
    [ 0.85,-1.65, 0.8], [-0.95,-1.25, 1.0],
  ]
  return (
    <>
      {nodePositions.map((pos, i) => {
        const points = [new THREE.Vector3(0,0,0), new THREE.Vector3(...pos)]
        const obj = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.12 })
        )
        return <primitive key={i} object={obj} />
      })}
    </>
  )
}

// ── Main scene ─────────────────────────────────────────────────────────────
export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 50 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      {/* Subtle ambient so mesh is never pitch black at edge */}
      <ambientLight intensity={0.08} />

      <GoldParticles />
      <GoldOrb />
      <OrbitalRings />
      <DataNodes />
      <ConnectorLines />
    </Canvas>
  )
}
