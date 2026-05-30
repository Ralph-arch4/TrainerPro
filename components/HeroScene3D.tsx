'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Colours ────────────────────────────────────────────────────────────────
const RED  = new THREE.Color('#C9A84C')
const ORG  = new THREE.Color('#C9A84C')

// ── Particle cloud (sphere distribution) ──────────────────────────────────
function ParticleField() {
  const mesh = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const count = 700
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere
      const phi   = Math.acos(1 - 2 * (i + 0.5) / count)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const r     = 2.6 + (Math.random() - 0.5) * 1.2
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const c = Math.random() > 0.5 ? RED : ORG
      col[i * 3]     = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    mesh.current.rotation.y = clock.elapsedTime * 0.04
    mesh.current.rotation.x = Math.sin(clock.elapsedTime * 0.018) * 0.2
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
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  )
}

// ── DNA double helix ───────────────────────────────────────────────────────
function DNAHelix() {
  const group = useRef<THREE.Group>(null)

  const { strand1, strand2, rungs } = useMemo(() => {
    const s1: [number,number,number][] = []
    const s2: [number,number,number][] = []
    const rg: { a: [number,number,number]; b: [number,number,number] }[] = []
    const N = 44
    for (let i = 0; i < N; i++) {
      const t     = i / (N - 1)
      const angle = t * Math.PI * 5
      const y     = (t - 0.5) * 4.4
      const R     = 0.55
      s1.push([Math.cos(angle) * R, y, Math.sin(angle) * R])
      s2.push([Math.cos(angle + Math.PI) * R, y, Math.sin(angle + Math.PI) * R])
      if (i % 4 === 0) rg.push({ a: s1[i], b: s2[i] })
    }
    return { strand1: s1, strand2: s2, rungs: rg }
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = clock.elapsedTime * 0.22
  })

  // Build tube for each strand
  const tubeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: RED, emissive: RED, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.6,
  }), [])
  const tubeMat2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: ORG, emissive: ORG, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.6,
  }), [])
  const rungMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FF9A6C', emissive: '#C9A84C', emissiveIntensity: 0.7,
    transparent: true, opacity: 0.55,
  }), [])

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), [])
  const rungGeo   = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 1, 6), [])

  return (
    <group ref={group} position={[0, 0, -0.5]}>
      {/* Strand 1 */}
      {strand1.map((pt, i) => (
        <mesh key={`s1-${i}`} geometry={sphereGeo} material={tubeMat} position={pt} />
      ))}
      {/* Strand 2 */}
      {strand2.map((pt, i) => (
        <mesh key={`s2-${i}`} geometry={sphereGeo} material={tubeMat2} position={pt} />
      ))}
      {/* Cross rungs */}
      {rungs.map(({ a, b }, i) => {
        const ax = new THREE.Vector3(...a)
        const bx = new THREE.Vector3(...b)
        const mid = ax.clone().add(bx).multiplyScalar(0.5)
        const len = ax.distanceTo(bx)
        const dir = bx.clone().sub(ax).normalize()
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
        return (
          <mesh key={`rg-${i}`} geometry={rungGeo} material={rungMat}
            position={mid.toArray()} quaternion={quat.toArray() as [number,number,number,number]}
            scale={[1, len, 1]} />
        )
      })}
    </group>
  )
}

// ── Orbital torus rings ─────────────────────────────────────────────────────
function TorusRings() {
  const r1 = useRef<THREE.Mesh>(null)
  const r2 = useRef<THREE.Mesh>(null)
  const r3 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (r1.current) { r1.current.rotation.z = t * 0.18; r1.current.rotation.x = t * 0.06 }
    if (r2.current) { r2.current.rotation.z = -t * 0.12; r2.current.rotation.y = t * 0.09 }
    if (r3.current) { r3.current.rotation.x = t * 0.15 }
  })

  const mat1 = useMemo(() => new THREE.MeshStandardMaterial({
    color: RED, emissive: RED, emissiveIntensity: 1.8,
    transparent: true, opacity: 0.55, wireframe: false,
  }), [])
  const mat2 = useMemo(() => new THREE.MeshStandardMaterial({
    color: ORG, emissive: ORG, emissiveIntensity: 1.4,
    transparent: true, opacity: 0.35, wireframe: false,
  }), [])
  const mat3 = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FF9A6C', emissive: '#FF9A6C', emissiveIntensity: 1.0,
    transparent: true, opacity: 0.22,
  }), [])

  return (
    <>
      <mesh ref={r1} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.8, 0.015, 8, 128]} />
        <primitive object={mat1} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 6, Math.PI / 5, 0]}>
        <torusGeometry args={[2.3, 0.01, 8, 128]} />
        <primitive object={mat2} />
      </mesh>
      <mesh ref={r3} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[1.3, 0.018, 8, 96]} />
        <primitive object={mat3} />
      </mesh>
    </>
  )
}

// ── Floating data nodes (pulsing spheres) ───────────────────────────────────
function DataNodes() {
  const group = useRef<THREE.Group>(null)
  const mats = useRef<THREE.MeshStandardMaterial[]>([])

  const positions: [number, number, number][] = useMemo(() => [
    [ 1.4,  1.2, 0.6], [-1.5,  0.8, 0.4],
    [ 0.8, -1.6, 0.8], [-0.9, -1.2, 1.0],
    [ 1.8, -0.4, 0.2], [-1.7,  0.1, 0.5],
  ], [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) group.current.rotation.y = t * 0.07
    mats.current.forEach((m, i) => {
      m.emissiveIntensity = 0.9 + Math.sin(t * 1.8 + i * 1.1) * 0.7
    })
  })

  const geo = useMemo(() => new THREE.SphereGeometry(0.07, 12, 12), [])

  return (
    <group ref={group}>
      {positions.map((pos, i) => {
        const mat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? RED : ORG,
          emissive: i % 2 === 0 ? RED : ORG,
          emissiveIntensity: 1.2,
          roughness: 0.2, metalness: 0.8,
        })
        // eslint-disable-next-line react-hooks/rules-of-hooks
        mats.current[i] = mat
        return <mesh key={i} geometry={geo} material={mat} position={pos} />
      })}
    </group>
  )
}

// ── Main exported scene ─────────────────────────────────────────────────────
export default function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 50 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 3, 3]}   color={RED} intensity={4} distance={12} />
      <pointLight position={[-3, -2, 2]} color={ORG} intensity={3} distance={10} />
      <pointLight position={[0, 4, -2]}  color="#FF2020" intensity={2} distance={8} />

      <ParticleField />
      <DNAHelix />
      <TorusRings />
      <DataNodes />
    </Canvas>
  )
}
