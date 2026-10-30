import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * ThreeDBackground — Liquid Glass & Bioluminescent Waves
 * 
 * Aesthetics:
 * 1. Flowing translucent teal & cyan liquid glass ribbons with dynamic helical twist
 * 2. Subtle light refractions & chromatic iridescent dispersion (Fresnel + rainbow rim highlights)
 * 3. High-specular glass glints that travel across fluid undulating curves
 * 4. Bioluminescent particle cloud & floating glowing motes orbiting the waves
 * 5. Minimalist, sophisticated, non-intrusive backdrop tuned for clean luxury product UI
 */
export default function ThreeDBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer = null
    let scene = null
    let camera = null
    let animId = null

    const disposables = {
      geometries: [],
      materials: [],
      textures: [],
    }

    try {
      // 1. Scene & Perspective Setup
      scene = new THREE.Scene()
      const width = window.innerWidth || 1200
      const height = window.innerHeight || 800

      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
      camera.position.set(0, 2, 38)

      // 2. High-Performance WebGL Renderer
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      container.appendChild(renderer.domElement)

      // 3. Glowing Particle Texture Generator
      const createGlowTexture = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
        grad.addColorStop(0.25, 'rgba(56, 189, 248, 0.85)')
        grad.addColorStop(0.55, 'rgba(20, 184, 166, 0.35)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 64, 64)

        const tex = new THREE.CanvasTexture(canvas)
        disposables.textures.push(tex)
        return tex
      }
      const particleTexture = createGlowTexture()

      // 4. Custom Liquid Glass Shader Material
      const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        uniform float uTime;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Micro-ripple wave along the liquid glass surface
          float ripple = sin(pos.x * 0.18 + uTime * 1.6) * cos(pos.y * 0.18 + uTime * 1.3) * 0.45;
          pos += normal * ripple;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;

          vec4 mvPosition = viewMatrix * worldPos;
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);

          gl_Position = projectionMatrix * mvPosition;
        }
      `

      const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        uniform float uTime;
        uniform vec3 uColorTeal;
        uniform vec3 uColorCyan;
        uniform vec3 uColorMagenta;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel glass refraction calculation
          float nDotV = abs(dot(viewDir, normal));
          float fresnel = pow(1.0 - nDotV, 2.4);

          // Iridescent chromatic dispersion along ribbon edges (rainbow sheen)
          float rainbow = sin(vUv.x * 7.0 + vUv.y * 3.5 + uTime * 0.9) * 0.5 + 0.5;
          vec3 baseGlass = mix(uColorTeal, uColorCyan, vUv.x);
          vec3 iridescentColor = mix(baseGlass, uColorMagenta, pow(rainbow, 2.2) * fresnel * 0.9);

          // Primary high-specular glass glint (soft caustic light reflection)
          vec3 lightDir1 = normalize(vec3(0.55, 0.85, 1.0));
          vec3 half1 = normalize(lightDir1 + viewDir);
          float spec1 = pow(max(dot(normal, half1), 0.0), 45.0) * 1.8;

          // Secondary subtle ambient rim light
          vec3 lightDir2 = normalize(vec3(-0.6, -0.7, 0.8));
          vec3 half2 = normalize(lightDir2 + viewDir);
          float spec2 = pow(max(dot(normal, half2), 0.0), 22.0) * 0.75;

          // Liquid core glow with soft transparency falloff
          vec3 color = iridescentColor * (0.32 + fresnel * 1.25) + vec3(spec1 + spec2 * 0.5);
          float alpha = clamp(0.12 + fresnel * 0.65 + spec1 * 0.45, 0.0, 0.78);

          gl_FragColor = vec4(color, alpha);
        }
      `

      const createGlassMaterial = () => {
        const mat = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uColorTeal: { value: new THREE.Color(0x0d9488) },   // Deep luminous teal
            uColorCyan: { value: new THREE.Color(0x38bdf8) },   // Electric cyan
            uColorMagenta: { value: new THREE.Color(0xe879f9) }, // Subtle chromatic dispersion sheen
          },
          transparent: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        disposables.materials.push(mat)
        return mat
      }

      // 5. Build Flowing Parametric Ribbon Geometries
      const N_SEGMENTS = 100 // Length resolution
      const M_STRIPS = 4     // Width resolution

      const createRibbonGeometry = () => {
        const geo = new THREE.BufferGeometry()
        const vertCount = (N_SEGMENTS + 1) * (M_STRIPS + 1)
        const positions = new Float32Array(vertCount * 3)
        const uvs = new Float32Array(vertCount * 2)

        let uvIdx = 0
        for (let i = 0; i <= N_SEGMENTS; i++) {
          const u = i / N_SEGMENTS
          for (let j = 0; j <= M_STRIPS; j++) {
            const v = j / M_STRIPS
            uvs[uvIdx++] = u
            uvs[uvIdx++] = v
          }
        }

        const indices = []
        for (let i = 0; i < N_SEGMENTS; i++) {
          for (let j = 0; j < M_STRIPS; j++) {
            const a = i * (M_STRIPS + 1) + j
            const b = (i + 1) * (M_STRIPS + 1) + j
            const c = (i + 1) * (M_STRIPS + 1) + (j + 1)
            const d = i * (M_STRIPS + 1) + (j + 1)

            indices.push(a, b, d)
            indices.push(b, c, d)
          }
        }

        geo.setIndex(indices)
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        disposables.geometries.push(geo)
        return geo
      }

      // Ribbon 1 (Main flowing liquid wave)
      const ribbon1Geo = createRibbonGeometry()
      const ribbon1Mat = createGlassMaterial()
      const ribbon1Mesh = new THREE.Mesh(ribbon1Geo, ribbon1Mat)
      scene.add(ribbon1Mesh)

      // Ribbon 2 (Intertwining secondary glass stream)
      const ribbon2Geo = createRibbonGeometry()
      const ribbon2Mat = createGlassMaterial()
      const ribbon2Mesh = new THREE.Mesh(ribbon2Geo, ribbon2Mat)
      scene.add(ribbon2Mesh)

      // Math function to compute fluid ribbon vertices along 3D space
      const updateRibbon = (geo, time, phase, widthScale, twistRate, yOffset) => {
        const posAttr = geo.attributes.position
        let vIdx = 0

        for (let i = 0; i <= N_SEGMENTS; i++) {
          const t = i / N_SEGMENTS

          // Center trajectory curve in 3D
          const cx = (t - 0.5) * 58.0
          const cy =
            Math.sin(t * 3.4 + time * 0.65 + phase) * 10.5 +
            Math.cos(t * 2.0 - time * 0.45 + phase * 1.4) * 5.0 +
            yOffset
          const cz = Math.cos(t * 2.8 + time * 0.55 + phase) * 12.0 - 4.0

          // Forward tangent estimation
          const nextT = Math.min(1.0, t + 0.012)
          const ncx = (nextT - 0.5) * 58.0
          const ncy =
            Math.sin(nextT * 3.4 + time * 0.65 + phase) * 10.5 +
            Math.cos(nextT * 2.0 - time * 0.45 + phase * 1.4) * 5.0 +
            yOffset
          const ncz = Math.cos(nextT * 2.8 + time * 0.55 + phase) * 12.0 - 4.0

          let tx = ncx - cx,
            ty = ncy - cy,
            tz = ncz - cz
          const tLen = Math.hypot(tx, ty, tz) || 1
          tx /= tLen
          ty /= tLen
          tz /= tLen

          // Normal & Binormal for ribbon width orientation
          const upX = 0,
            upY = 1,
            upZ = 0
          let nx = ty * upZ - tz * upY,
            ny = tz * upX - tx * upZ,
            nz = tx * upY - ty * upX
          const nLen = Math.hypot(nx, ny, nz) || 1
          nx /= nLen
          ny /= nLen
          nz /= nLen

          const bx = ty * nz - tz * ny,
            by = tz * nx - tx * nz,
            bz = tx * ny - ty * nx

          // Liquid twist along the length
          const twist = t * Math.PI * 3.6 + time * twistRate + phase
          const cosTwist = Math.cos(twist)
          const sinTwist = Math.sin(twist)

          const rVecX = nx * cosTwist + bx * sinTwist
          const rVecY = ny * cosTwist + by * sinTwist
          const rVecZ = nz * cosTwist + bz * sinTwist

          // Fluid tapering: thin at start/tail, wide and voluptuous in the body
          const taper = Math.sin(t * Math.PI) * widthScale

          for (let j = 0; j <= M_STRIPS; j++) {
            const w = (j / M_STRIPS - 0.5) * 2.0 * taper
            posAttr.setXYZ(
              vIdx++,
              cx + rVecX * w,
              cy + rVecY * w,
              cz + rVecZ * w
            )
          }
        }

        geo.computeVertexNormals()
        posAttr.needsUpdate = true
      }

      // 6. Bioluminescent Particle Cloud
      const PARTICLE_COUNT = 320
      const particlePositions = new Float32Array(PARTICLE_COUNT * 3)
      const particleColors = new Float32Array(PARTICLE_COUNT * 3)
      const particleSpeeds = new Float32Array(PARTICLE_COUNT)

      const colorTeal = new THREE.Color(0x14b8a6)
      const colorCyan = new THREE.Color(0x38bdf8)
      const colorViolet = new THREE.Color(0xa78bfa)

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        particlePositions[i3] = (Math.random() - 0.5) * 75
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 45
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 35 - 3

        const rand = Math.random()
        const c = rand > 0.6 ? colorTeal : rand > 0.25 ? colorCyan : colorViolet
        particleColors[i3] = c.r
        particleColors[i3 + 1] = c.g
        particleColors[i3 + 2] = c.b

        particleSpeeds[i] = 0.015 + Math.random() * 0.025
      }

      const particleGeo = new THREE.BufferGeometry()
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
      disposables.geometries.push(particleGeo)

      const particleMat = new THREE.PointsMaterial({
        size: 1.8,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      disposables.materials.push(particleMat)

      const particleSystem = new THREE.Points(particleGeo, particleMat)
      scene.add(particleSystem)

      // 7. Ambient Deep Bokeh Glow Spheres
      const BOKEH_COUNT = 18
      const bokehGeo = new THREE.BufferGeometry()
      const bokehPos = new Float32Array(BOKEH_COUNT * 3)
      for (let i = 0; i < BOKEH_COUNT; i++) {
        bokehPos[i * 3] = (Math.random() - 0.5) * 80
        bokehPos[i * 3 + 1] = (Math.random() - 0.5) * 50
        bokehPos[i * 3 + 2] = -15 + (Math.random() - 0.5) * 20
      }
      bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3))
      disposables.geometries.push(bokehGeo)

      const bokehMat = new THREE.PointsMaterial({
        size: 9.0,
        map: particleTexture,
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      disposables.materials.push(bokehMat)

      const bokehSystem = new THREE.Points(bokehGeo, bokehMat)
      scene.add(bokehSystem)

      // 8. Mouse Parallax & Dynamic Resize Handlers
      let mouseX = 0
      let mouseY = 0
      let targetX = 0
      let targetY = 0

      const handleMouseMove = (e) => {
        const halfW = window.innerWidth / 2
        const halfH = window.innerHeight / 2
        mouseX = (e.clientX - halfW) * 0.0005
        mouseY = (e.clientY - halfH) * 0.0005
      }
      window.addEventListener('mousemove', handleMouseMove, { passive: true })

      const handleResize = () => {
        if (!camera || !renderer) return
        const w = window.innerWidth || 1200
        const h = window.innerHeight || 800
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      // 9. 60FPS Fluid Animation Loop
      const clock = new THREE.Clock()

      const animate = () => {
        animId = requestAnimationFrame(animate)
        const elapsedTime = clock.getElapsedTime()

        // Parallax damping
        targetX += (mouseX - targetX) * 0.04
        targetY += (mouseY - targetY) * 0.04

        // Update liquid shader uniforms
        ribbon1Mat.uniforms.uTime.value = elapsedTime
        ribbon2Mat.uniforms.uTime.value = elapsedTime

        // Animate Ribbon 1 (Primary graceful teal/cyan liquid wave)
        updateRibbon(
          ribbon1Geo,
          elapsedTime,
          0.0,      // Phase 0
          4.8,      // Width scale
          0.45,     // Twist speed
          1.5       // Y offset
        )

        // Animate Ribbon 2 (Secondary intertwining liquid wave)
        updateRibbon(
          ribbon2Geo,
          elapsedTime,
          Math.PI * 0.72, // Intertwined phase offset
          3.6,            // Slightly narrower
          -0.38,          // Counter-twist
          -2.2            // Lower Y offset
        )

        // Float bioluminescent particles
        const pArr = particleGeo.attributes.position.array
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3
          pArr[i3 + 1] += particleSpeeds[i]
          pArr[i3] += Math.sin(elapsedTime * 0.35 + i) * 0.015
          pArr[i3 + 2] += Math.cos(elapsedTime * 0.28 + i) * 0.012

          // Wrap to bottom when floating off top
          if (pArr[i3 + 1] > 24) {
            pArr[i3 + 1] = -24
            pArr[i3] = (Math.random() - 0.5) * 75
          }
        }
        particleGeo.attributes.position.needsUpdate = true

        // Float ambient bokeh orbs
        const bArr = bokehGeo.attributes.position.array
        for (let j = 0; j < BOKEH_COUNT; j++) {
          const j3 = j * 3
          bArr[j3 + 1] += 0.008
          bArr[j3] += Math.sin(elapsedTime * 0.2 + j) * 0.01
          if (bArr[j3 + 1] > 26) bArr[j3 + 1] = -26
        }
        bokehGeo.attributes.position.needsUpdate = true

        // Camera gentle drift & mouse parallax
        camera.position.x += (targetX * 12 - camera.position.x) * 0.035
        camera.position.y += (-targetY * 8 + 2 - camera.position.y) * 0.035
        camera.lookAt(0, 0, -4)

        renderer.render(scene, camera)
      }

      animate()

      // 10. Robust WebGL Resource Disposal
      return () => {
        if (animId) cancelAnimationFrame(animId)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('resize', handleResize)

        if (container && renderer?.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }

        disposables.geometries.forEach((g) => g.dispose())
        disposables.materials.forEach((m) => m.dispose())
        disposables.textures.forEach((t) => t.dispose())
        renderer?.dispose()
      }
    } catch (err) {
      console.warn('WebGL initialization skipped for liquid glass background:', err)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        background: `
          radial-gradient(circle at 25% 32%, rgba(6, 182, 212, 0.12) 0%, transparent 48%),
          radial-gradient(circle at 75% 68%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(13, 22, 38, 0.5) 0%, #060910 100%)
        `,
      }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
