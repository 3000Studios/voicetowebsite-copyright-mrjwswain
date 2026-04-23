import React, { useEffect, useRef } from 'react'

const GRID_DEPTH = 44
const GRID_WIDTH = 34
const LAYERS = 3

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function hsl(h, s, l, a) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function SynthWaveWallpaper({ opacity = 0.5 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined

    const reduceMotion = prefersReducedMotion()
    let animationFrame = 0
    let width = 0
    let height = 0
    let dpr = 1

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    let scrollY = 0

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function onPointerMove(event) {
      pointer.tx = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2
      pointer.ty = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2
    }

    function onTouchMove(event) {
      const touch = event.touches?.[0]
      if (!touch) return
      pointer.tx = (touch.clientX / Math.max(1, window.innerWidth) - 0.5) * 2
      pointer.ty = (touch.clientY / Math.max(1, window.innerHeight) - 0.5) * 2
    }

    function onDeviceOrientation(event) {
      const gamma = Number(event.gamma || 0)
      const beta = Number(event.beta || 0)
      tilt.tx = clamp(gamma / 25, -1, 1)
      tilt.ty = clamp(beta / 35, -1, 1)
    }

    function onScroll() {
      scrollY = window.scrollY || 0
    }

    function project(point, horizonY, perspective) {
      const z = Math.max(0.0001, point.z)
      const scale = perspective / (perspective + z)
      return {
        x: width / 2 + point.x * scale,
        y: horizonY + point.y * scale,
        scale
      }
    }

    function draw(timestamp) {
      // Smooth inputs so it feels "liquid".
      const ease = 0.08
      pointer.x = lerp(pointer.x, pointer.tx, ease)
      pointer.y = lerp(pointer.y, pointer.ty, ease)
      tilt.x = lerp(tilt.x, tilt.tx, ease * 0.8)
      tilt.y = lerp(tilt.y, tilt.ty, ease * 0.8)

      const t = timestamp * 0.001
      const scrollPhase = scrollY * 0.0012
      const horizonY = height * 0.58 + (pointer.y + tilt.y) * 30
      const perspective = 820 + (pointer.x + tilt.x) * 120

      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      // Fade so it never blocks content.
      const baseAlpha = clamp(opacity, 0, 0.65)

      for (let layer = 0; layer < LAYERS; layer += 1) {
        const layerT = t * (0.7 + layer * 0.18) + layer * 1.25
        const hue = (260 + layer * 26 + t * 18 + scrollPhase * 22) % 360
        const depthSpacing = 78 + layer * 14
        const amplitude = 62 + layer * 18

        // Horizontal "rows" of the wave grid.
        for (let zIndex = 0; zIndex < GRID_DEPTH; zIndex += 1) {
          const z = zIndex * depthSpacing
          const zRatio = zIndex / (GRID_DEPTH - 1)
          const rowAlpha = baseAlpha * (1 - zRatio) * 0.55
          const waveShift = layerT + zRatio * 2.1 + pointer.x * 0.6

          context.beginPath()
          for (let xIndex = 0; xIndex < GRID_WIDTH; xIndex += 1) {
            const xRatio = xIndex / (GRID_WIDTH - 1)
            const x = (xRatio - 0.5) * (width * 1.2)
            const wobble =
              Math.sin(xRatio * 7 + waveShift) * 0.55 +
              Math.sin(xRatio * 2.6 + waveShift * 1.5) * 0.45
            const heightWave =
              wobble * amplitude * (0.22 + zRatio * 0.9) +
              Math.sin(layerT * 1.1 + xRatio * 4.2) * 8
            const y = heightWave + (zRatio - 0.5) * 28

            const projected = project({ x, y, z }, horizonY, perspective)
            if (xIndex === 0) context.moveTo(projected.x, projected.y)
            else context.lineTo(projected.x, projected.y)
          }

          context.strokeStyle = hsl(hue, 85, 62, rowAlpha)
          context.lineWidth = 1.25 + (1 - zRatio) * 1.5
          context.stroke()
        }

        // Vertical "columns" of the grid.
        for (let xIndex = 0; xIndex < GRID_WIDTH; xIndex += 3) {
          const xRatio = xIndex / (GRID_WIDTH - 1)
          const x = (xRatio - 0.5) * (width * 1.2)
          const colAlpha = baseAlpha * 0.09
          context.beginPath()

          for (let zIndex = 0; zIndex < GRID_DEPTH; zIndex += 1) {
            const z = zIndex * depthSpacing
            const zRatio = zIndex / (GRID_DEPTH - 1)
            const waveShift = layerT + zRatio * 2.1 + pointer.x * 0.6
            const wobble =
              Math.sin(xRatio * 7 + waveShift) * 0.55 +
              Math.sin(xRatio * 2.6 + waveShift * 1.5) * 0.45
            const heightWave = wobble * amplitude * (0.22 + zRatio * 0.9)
            const y = heightWave + (zRatio - 0.5) * 28
            const projected = project({ x, y, z }, horizonY, perspective)

            if (zIndex === 0) context.moveTo(projected.x, projected.y)
            else context.lineTo(projected.x, projected.y)
          }

          context.strokeStyle = hsl(hue + 40, 78, 70, colAlpha)
          context.lineWidth = 1
          context.stroke()
        }
      }

      // Subtle scanline veil for "synth" texture.
      context.globalCompositeOperation = 'source-over'
      context.fillStyle = 'rgba(3, 6, 12, 0.10)'
      context.fillRect(0, 0, width, height)

      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 1

      animationFrame = window.requestAnimationFrame(draw)
    }

    resize()
    onScroll()

    if (reduceMotion) {
      draw(0)
    } else {
      animationFrame = window.requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('deviceorientation', onDeviceOrientation)
    }
  }, [opacity])

  return (
    <div className="synthwave-wallpaper" aria-hidden="true">
      <canvas ref={canvasRef} className="synthwave-wallpaper__canvas" />
      <span className="synthwave-wallpaper__veil" />
    </div>
  )
}

