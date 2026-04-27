import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GlobalVoiceWaveWallpaper() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Waves
    const waveCount = 8
    const waves = []
    
    const colors = [
      new THREE.Color('#7cf7d4'), // Cyan
      new THREE.Color('#ff5aec'), // Pink
      new THREE.Color('#8a5cf6'), // Purple
      new THREE.Color('#38bdf8'), // Sky
      new THREE.Color('#ff8cc6'), // Rose
    ]

    for (let i = 0; i < waveCount; i++) {
      const geometry = new THREE.PlaneGeometry(20, 10, 100, 100)
      const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: colors[i % colors.length] },
          uOpacity: { value: 0.15 + (i * 0.05) },
          uOffset: { value: i * 0.5 },
          uSpeed: { value: 0.2 + (i * 0.1) }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uOffset;
          uniform float uSpeed;
          varying vec2 vUv;
          varying float vElevation;

          void main() {
            vUv = uv;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            float elevation = sin(modelPosition.x * 0.5 + uTime * uSpeed + uOffset) * 
                              sin(modelPosition.z * 0.3 + uTime * uSpeed * 0.5) * 0.8;
            
            modelPosition.y += elevation;
            
            vElevation = elevation;
            
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectionPosition = projectionMatrix * viewPosition;
            gl_Position = projectionPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying float vElevation;

          void main() {
            float strength = (vElevation + 0.8) / 1.6;
            vec3 finalColor = mix(uColor * 0.5, uColor, strength);
            
            // Fade edges
            float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) *
                             smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            
            gl_FragColor = vec4(finalColor, uOpacity * edgeFade * (0.4 + strength * 0.6));
          }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI * 0.3
      mesh.position.y = -1 + (i * 0.2)
      mesh.position.z = -i * 0.5
      scene.add(mesh)
      waves.push(mesh)
    }

    // Particles for "cluster" feel
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 1000
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: '#7cf7d4',
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      waves.forEach((wave, i) => {
        wave.material.uniforms.uTime.value = elapsedTime
        // Dynamic color shifting
        const hue = (elapsedTime * 0.05 + i * 0.1) % 1
        wave.material.uniforms.uColor.value.setHSL(hue, 0.7, 0.6)
      })

      particlesMesh.rotation.y = elapsedTime * 0.05
      particlesMesh.position.y = Math.sin(elapsedTime * 0.2) * 0.2

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="global-voice-wallpaper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #060914, #0b1020)',
        overflow: 'hidden'
      }}
    >
      <div className="wallpaper-vignette" style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 20%, rgba(6, 9, 20, 0.6) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  )
}
