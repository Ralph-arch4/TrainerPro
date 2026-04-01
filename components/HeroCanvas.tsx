'use client'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import HeroScene from './HeroScene'

export default function HeroCanvas() {
  return (
    <div
      className="w-full h-full"
      style={{
        filter:
          'drop-shadow(0 0 22px #FF6B2B66) drop-shadow(0 0 8px #FF6B2B33)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 44 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={1}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
