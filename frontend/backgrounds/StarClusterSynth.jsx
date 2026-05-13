import React, { useEffect, useRef } from 'react'

const STAR_COUNT = 520
const WAVE_LAYERS = 7
const RING_COUNT = 4
const CAMERA_Z = 780

const SYNTH_PALETTE = [
  { r: 255, g: 90, b: 200 },
  { r: 122, g: 246, b: 217 },
  { r: 138, g: 92, b: 246 },
  { r: 56, g: 189, b: 248 },
  { r: 255, g: 122, b: 24 }
]

function pickColor(index) {
  return SYNTH_PALETTE[index % SYNTH_PALETTE.length]
}

function toRgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

function createStars() {
  const stars = []
  for (let index = 0; index < STAR_COUNT; index += 1) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 240 + Math.random() * 380

    stars.push({
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi),
      size: Math.random() * 1.6 + 0.4,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.6 + Math.random() * 1.4,
      color: pickColor(Math.floor(Math.random() * SYNTH_PALETTE.length))
    })
  }
  return stars
}

function createRings() {
  const rings = []
  for (let index = 0; index < RING_COUNT; index += 1) {
    rings.push({
      radius: 260 + index * 110,
      tilt: (index - RING_COUNT / 2) * 0.35,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.12 + index * 0.05,
      color: pickColor(index + 1)
    })
  }
  return rings
}

function rotateY(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  }
}

function rotateX(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  }
}

function project(point, centerX, centerY) {
  const depth = CAMERA_Z + point.z
  if (depth <= 1) {
    return null
  }
  const scale = CAMERA_Z / depth
  return {
    x: centerX + point.x * scale,
    y: centerY + point.y * scale,
    scale,
    depth
  }
}

export default function StarClusterSynth({ density = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) {
      return undefined
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animationFrame = 0
    let width = 0
    let height = 0
    let devicePixelRatio = 1
    let lastTimestamp = 0
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const stars = createStars().slice(0, Math.max(80, Math.round(STAR_COUNT * density)))
    const rings = createRings()

    function resize() {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    function handlePointerMove(event) {
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2
    }

    function drawRings(time, centerX, centerY) {
      context.globalCompositeOperation = 'lighter'
      rings.forEach((ring, index) => {
        const rotation = ring.rotation + time * ring.speed * 0.0005
        context.beginPath()
        const segments = 96
        for (let step = 0; step <= segments; step += 1) {
          const angle = (step / segments) * Math.PI * 2
          const raw = {
            x: Math.cos(angle) * ring.radius,
            y: Math.sin(angle) * ring.radius * 0.35,
            z: 0
          }
          const tilted = rotateX(raw, ring.tilt)
          const spun = rotateY(tilted, rotation + pointer.x * 0.15)
          const tiltedAgain = rotateX(spun, pointer.y * 0.12)
          const projected = project(tiltedAgain, centerX, centerY)
          if (!projected) continue
          if (step === 0) {
            context.moveTo(projected.x, projected.y)
          } else {
            context.lineTo(projected.x, projected.y)
          }
        }
        const alpha = 0.08 + (index / rings.length) * 0.06
        context.strokeStyle = toRgba(ring.color, alpha)
        context.lineWidth = 1.1
        context.stroke()
      })
    }

    function drawStars(time, centerX, centerY) {
      const baseRotationY = time * 0.00018 + pointer.x * 0.4
      const baseRotationX = Math.sin(time * 0.00009) * 0.15 + pointer.y * 0.3
      context.globalCompositeOperation = 'lighter'

      for (const star of stars) {
        const rotatedY = rotateY(star, baseRotationY)
        const rotated = rotateX(rotatedY, baseRotationX)
        const projected = project(rotated, centerX, centerY)
        if (!projected) continue

        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase + time * 0.001 * star.twinkleSpeed)
        const depthFade = Math.max(0, Math.min(1, 1 - (rotated.z + 400) / 1600))
        const alpha = 0.25 + twinkle * 0.55 * depthFade
        const radius = Math.max(0.4, star.size * projected.scale * 1.2)

        const gradient = context.createRadialGradient(
          projected.x,
          projected.y,
          0,
          projected.x,
          projected.y,
          radius * 5
        )
        gradient.addColorStop(0, toRgba(star.color, alpha))
        gradient.addColorStop(0.35, toRgba(star.color, alpha * 0.35))
        gradient.addColorStop(1, toRgba(star.color, 0))
        context.fillStyle = gradient
        context.beginPath()
        context.arc(projected.x, projected.y, radius * 5, 0, Math.PI * 2)
        context.fill()

        context.fillStyle = toRgba(star.color, Math.min(1, alpha * 1.6))
        context.beginPath()
        context.arc(projected.x, projected.y, radius, 0, Math.PI * 2)
        context.fill()
      }
    }

    function drawSynthWaves(time) {
      context.globalCompositeOperation = 'lighter'
      const centerY = height / 2

      for (let layer = 0; layer < WAVE_LAYERS; layer += 1) {
        const layerRatio = layer / (WAVE_LAYERS - 1)
        const amplitude = (height / 11) * (0.55 + layerRatio * 0.9)
        const frequency = 0.0045 + layerRatio * 0.0032
        const phase = time * (0.0006 + layerRatio * 0.0009) + layer * 1.1
        const yOffset = centerY + (layerRatio - 0.5) * height * 0.78
        const color = pickColor(layer + 1)
        const alphaTop = 0.22 + layerRatio * 0.16
        const alphaBottom = 0.02

        const gradient = context.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, toRgba(color, alphaBottom))
        gradient.addColorStop(0.5, toRgba(color, alphaTop))
        gradient.addColorStop(1, toRgba(color, alphaBottom))

        context.strokeStyle = gradient
        context.lineWidth = 1.1 + layerRatio * 1.6
        context.beginPath()

        const step = Math.max(3, Math.floor(width / 220))
        for (let x = 0; x <= width; x += step) {
          const wobble = Math.sin(x * frequency + phase) * amplitude
          const harmonic = Math.sin(x * frequency * 2.3 + phase * 1.7) * amplitude * 0.28
          const drift = Math.sin(time * 0.0004 + layer) * 10
          const y = yOffset + wobble + harmonic + drift + pointer.y * 20 * layerRatio
          if (x === 0) {
            context.moveTo(x, y)
          } else {
            context.lineTo(x, y)
          }
        }
        context.stroke()

        context.lineWidth *= 2.6
        context.globalAlpha = 0.18
        context.stroke()
        context.globalAlpha = 1
      }
    }

    function drawScanlines() {
      context.globalCompositeOperation = 'source-over'
      context.fillStyle = 'rgba(10, 14, 28, 0.04)'
      const bandHeight = 3
      for (let y = 0; y < height; y += bandHeight * 2) {
        context.fillRect(0, y, width, bandHeight)
      }
    }

    function render(timestamp) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp
      }
      const delta = timestamp - lastTimestamp
      lastTimestamp = timestamp

      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 0.003)
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 0.003)

      context.clearRect(0, 0, width, height)

      const centerX = width / 2 + pointer.x * 30
      const centerY = height / 2 + pointer.y * 20

      drawSynthWaves(timestamp)
      drawRings(timestamp, centerX, centerY)
      drawStars(timestamp, centerX, centerY)
      drawScanlines()

      animationFrame = window.requestAnimationFrame(render)
    }

    resize()
    if (prefersReducedMotion) {
      drawSynthWaves(0)
      drawRings(0, width / 2, height / 2)
      drawStars(0, width / 2, height / 2)
      drawScanlines()
    } else {
      animationFrame = window.requestAnimationFrame(render)
    }

    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [density])

  return (
    <div className="star-cluster" aria-hidden="true">
      <canvas ref={canvasRef} className="star-cluster__canvas" />
      <span className="star-cluster__vignette" />
    </div>
  )
}
