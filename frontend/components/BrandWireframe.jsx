import React, { useEffect, useRef } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

export default function BrandWireframe({ size = 34 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (prefersReducedMotion()) return undefined

    let disposed = false
    let renderer = null
    let scene = null
    let camera = null
    let group = null
    let geometry = null
    let material = null
    let glowGeometry = null
    let glowMaterial = null

    function resize() {
      if (!renderer || !camera) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      renderer.setPixelRatio(dpr)
      renderer.setSize(size, size, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }

    let raf = 0
    const start = performance.now()

    const tick = (now) => {
      if (!renderer || !scene || !camera || !group) return
      const t = (now - start) / 1000
      group.rotation.x = t * 0.45
      group.rotation.y = t * 0.65
      group.rotation.z = t * 0.12
      renderer.render(scene, camera)
      raf = window.requestAnimationFrame(tick)
    }

    ;(async () => {
      const THREE = await import('three')
      if (disposed) return

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      })

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20)
      camera.position.set(0, 0, 6)

      group = new THREE.Group()
      scene.add(group)

      geometry = new THREE.IcosahedronGeometry(1.6, 1)
      material = new THREE.MeshBasicMaterial({
        color: 0x69b7d6,
        wireframe: true,
        transparent: true,
        opacity: 0.95
      })
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)

      glowGeometry = new THREE.IcosahedronGeometry(1.62, 1)
      glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xb8d6e4,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      group.add(glow)

      resize()
      raf = window.requestAnimationFrame(tick)
    })()

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      disposed = true
      window.removeEventListener('resize', handleResize)
      window.cancelAnimationFrame(raf)
      geometry?.dispose()
      glowGeometry?.dispose()
      material?.dispose()
      glowMaterial?.dispose()
      renderer?.dispose()
    }
  }, [size])

  return <canvas className="brand__wireframe" ref={canvasRef} width={size} height={size} aria-hidden="true" />
}
