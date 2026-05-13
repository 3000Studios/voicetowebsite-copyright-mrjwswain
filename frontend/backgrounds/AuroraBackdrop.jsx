import React, { useEffect, useRef } from 'react'

function hexToRgba(color, alpha) {
  const normalized = color.replace('#', '')
  const short = normalized.length === 3
  const fullColor = short
    ? normalized
        .split('')
        .map((value) => value + value)
        .join('')
    : normalized

  const red = Number.parseInt(fullColor.slice(0, 2), 16)
  const green = Number.parseInt(fullColor.slice(2, 4), 16)
  const blue = Number.parseInt(fullColor.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export default function AuroraBackdrop({ variant = 'marketing' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return undefined
    }

    const rootStyles = getComputedStyle(document.documentElement)
    const palette = {
      background: rootStyles.getPropertyValue('--bg').trim() || '#050505',
      prismOne: rootStyles.getPropertyValue('--prism-1').trim() || '#ff0055',
      prismTwo: rootStyles.getPropertyValue('--prism-2').trim() || '#00ffcc',
      prismThree: rootStyles.getPropertyValue('--prism-3').trim() || '#5500ff'
    }

    let animationFrame = 0
    let width = 0
    let height = 0
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const particleCount = variant === 'admin' ? 18 : 26
    const particles = Array.from({ length: particleCount }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 220 + 120,
      color: [palette.prismOne, palette.prismTwo, palette.prismThree][index % 3]
    }))

    function resizeCanvas() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    function handlePointerMove(event) {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    function drawBlob(particle) {
      const gradient = context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      )
      gradient.addColorStop(0, hexToRgba(particle.color, 0.14))
      gradient.addColorStop(0.45, hexToRgba(particle.color, 0.07))
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = gradient
      context.beginPath()
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      context.fill()
    }

    function drawPointerGlow() {
      const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180)
      gradient.addColorStop(0, hexToRgba(palette.prismTwo, 0.16))
      gradient.addColorStop(0.35, hexToRgba(palette.prismOne, 0.08))
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = gradient
      context.beginPath()
      context.arc(pointer.x, pointer.y, 180, 0, Math.PI * 2)
      context.fill()
    }

    function animate() {
      context.fillStyle = hexToRgba(palette.background, 0.18)
      context.fillRect(0, 0, width, height)

      context.globalCompositeOperation = 'screen'
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -particle.size || particle.x > width + particle.size) {
          particle.vx *= -1
        }

        if (particle.y < -particle.size || particle.y > height + particle.size) {
          particle.vy *= -1
        }

        drawBlob(particle)
      })
      drawPointerGlow()
      context.globalCompositeOperation = 'source-over'
      animationFrame = window.requestAnimationFrame(animate)
    }

    resizeCanvas()
    animate()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [variant])

  return (
    <div className={`aurora aurora--${variant}`} aria-hidden="true">
      <div className="aurora__veil">
        <canvas ref={canvasRef} className="aurora__canvas" />
      </div>
      <span className="aurora__blob aurora__blob--a" />
      <span className="aurora__blob aurora__blob--b" />
      <span className="aurora__blob aurora__blob--c" />
      <span className="aurora__grid" />
    </div>
  )
}
