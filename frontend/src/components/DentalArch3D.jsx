import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import {
  RotateCcw,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Maximize2,
  Box
} from 'lucide-react'

// Anatomical names for all 32 FDI teeth
const FDI_ANATOMICAL_NAMES = {
  18: 'Maxillary Right 3rd Molar (Wisdom)',
  17: 'Maxillary Right 2nd Molar',
  16: 'Maxillary Right 1st Molar',
  15: 'Maxillary Right 2nd Premolar',
  14: 'Maxillary Right 1st Premolar',
  13: 'Maxillary Right Canine',
  12: 'Maxillary Right Lateral Incisor',
  11: 'Maxillary Right Central Incisor',
  21: 'Maxillary Left Central Incisor',
  22: 'Maxillary Left Lateral Incisor',
  23: 'Maxillary Left Canine',
  24: 'Maxillary Left 1st Premolar',
  25: 'Maxillary Left 2nd Premolar',
  26: 'Maxillary Left 1st Molar',
  27: 'Maxillary Left 2nd Molar',
  28: 'Maxillary Left 3rd Molar (Wisdom)',
  31: 'Mandibular Left Central Incisor',
  32: 'Mandibular Left Lateral Incisor',
  33: 'Mandibular Left Canine',
  34: 'Mandibular Left 1st Premolar',
  35: 'Mandibular Left 2nd Premolar',
  36: 'Mandibular Left 1st Molar',
  37: 'Mandibular Left 2nd Molar',
  38: 'Mandibular Left 3rd Molar (Wisdom)',
  41: 'Mandibular Right Central Incisor',
  42: 'Mandibular Right Lateral Incisor',
  43: 'Mandibular Right Canine',
  44: 'Mandibular Right 1st Premolar',
  45: 'Mandibular Right 2nd Premolar',
  46: 'Mandibular Right 1st Molar',
  47: 'Mandibular Right 2nd Molar',
  48: 'Mandibular Right 3rd Molar (Wisdom)',
}

function getToothPosition(fdi) {
  const isUpper = fdi < 30
  const isRight = (fdi >= 11 && fdi <= 18) || (fdi >= 41 && fdi <= 48)
  const toothIndex = fdi % 10

  const t = 0.08 + (toothIndex - 1) * 0.125
  const angle = isRight ? -Math.PI / 2 + t * 1.55 : -Math.PI / 2 - t * 1.55

  const archWidth = 14
  const archDepth = 17

  const x = Math.sin(angle) * archWidth
  const z = (Math.cos(angle) + 1) * archDepth * 0.65 - 8
  const y = isUpper ? 3.2 : -3.2

  const rotY = isRight ? -angle - Math.PI / 2 : -angle + Math.PI / 2

  return { x, y, z, rotY, isUpper, isRight, toothIndex }
}

export default function DentalArch3D({ rows = [], onSelectTooth, selectedFdi }) {
  const mountRef = useRef(null)
  const [hoveredTooth, setHoveredTooth] = useState(null)
  const [activeTooth, setActiveTooth] = useState(null)
  const [archView, setArchView] = useState('all')
  const [renderMode, setRenderMode] = useState('hologram')
  const [autoRotate, setAutoRotate] = useState(true)
  const [webglSupported, setWebglSupported] = useState(true)

  const toothDataMap = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const fdi = Number(r.FDI ?? r.fdi)
      if (fdi) {
        map.set(fdi, {
          fdi,
          toothConf: Number(r['Tooth Confidence'] ?? r.tooth_confidence ?? 0),
          finding: String(r.Finding ?? r.finding ?? 'None'),
          findingConf: Number(r['Finding Confidence'] ?? r.finding_confidence ?? 0),
          overlap: Number(r.Overlap ?? r.overlap ?? 0),
        })
      }
    })
    return map
  }, [rows])

  useEffect(() => {
    if (selectedFdi && FDI_ANATOMICAL_NAMES[selectedFdi]) {
      const fdiData = toothDataMap.get(selectedFdi) || {
        fdi: selectedFdi,
        toothConf: 0,
        finding: 'None',
        findingConf: 0,
        overlap: 0,
      }
      setActiveTooth(fdiData)
    }
  }, [selectedFdi, toothDataMap])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer = null
    let animationFrameId = null

    try {
      const width = Math.max(mount.clientWidth || 600, 200)
      const height = Math.max(mount.clientHeight || 400, 200)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(0, 16, 32)
      camera.lookAt(0, 0, 0)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      mount.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambientLight)

      const mainLight = new THREE.DirectionalLight(0x72e3d0, 1.4)
      mainLight.position.set(15, 25, 20)
      scene.add(mainLight)

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.9)
      fillLight.position.set(-15, -10, 15)
      scene.add(fillLight)

      const centerPointLight = new THREE.PointLight(0x72e3d0, 1.2, 50)
      centerPointLight.position.set(0, 0, 0)
      scene.add(centerPointLight)

      // Curves
      const upperCurvePoints = []
      const lowerCurvePoints = []
      for (let i = 0; i <= 36; i++) {
        const a = -Math.PI + (i / 36) * Math.PI
        const x = Math.sin(a) * 14.5
        const z = (Math.cos(a) + 1) * 11 - 8
        upperCurvePoints.push(new THREE.Vector3(x, 3.2, z))
        lowerCurvePoints.push(new THREE.Vector3(x, -3.2, z))
      }
      const upperCurveGeo = new THREE.BufferGeometry().setFromPoints(upperCurvePoints)
      const lowerCurveGeo = new THREE.BufferGeometry().setFromPoints(lowerCurvePoints)
      const curveMat = new THREE.LineDashedMaterial({
        color: 0x243340,
        dashSize: 0.8,
        gapSize: 0.4,
        transparent: true,
        opacity: 0.6,
      })
      const upperLine = new THREE.Line(upperCurveGeo, curveMat)
      upperLine.computeLineDistances()
      scene.add(upperLine)

      const lowerLine = new THREE.Line(lowerCurveGeo, curveMat)
      lowerLine.computeLineDistances()
      scene.add(lowerLine)

      const archGroup = new THREE.Group()
      scene.add(archGroup)

      const toothMeshes = new Map()
      const allFdiKeys = Object.keys(FDI_ANATOMICAL_NAMES).map(Number)

      allFdiKeys.forEach((fdi) => {
        const { x, y, z, rotY, isUpper, toothIndex } = getToothPosition(fdi)
        const data = toothDataMap.get(fdi)
        const isDetected = !!data
        const finding = (data?.finding || 'None').toLowerCase()

        let toothColor = 0x243340
        let emissiveColor = 0x000000
        let emissiveIntensity = 0.1

        if (isDetected) {
          if (finding.includes('caries')) {
            toothColor = 0xef4444
            emissiveColor = 0xef4444
            emissiveIntensity = 0.6
          } else if (finding.includes('implant')) {
            toothColor = 0x3b82f6
            emissiveColor = 0x1d4ed8
            emissiveIntensity = 0.5
          } else if (finding.includes('filling') || finding.includes('composite')) {
            toothColor = 0xf59e0b
            emissiveColor = 0xb45309
            emissiveIntensity = 0.45
          } else if (finding.includes('amalgam')) {
            toothColor = 0x94a3b8
            emissiveColor = 0x475569
            emissiveIntensity = 0.4
          } else if (finding.includes('crown')) {
            toothColor = 0xa855f7
            emissiveColor = 0x7e22ce
            emissiveIntensity = 0.5
          } else {
            toothColor = 0x72e3d0
            emissiveColor = 0x10b981
            emissiveIntensity = 0.45
          }
        }

        const isMolar = toothIndex >= 6
        const isPremolar = toothIndex === 4 || toothIndex === 5
        const isCanine = toothIndex === 3

        const crownWidth = isMolar ? 2.1 : isPremolar ? 1.6 : isCanine ? 1.4 : 1.3
        const crownHeight = isUpper ? 2.5 : 2.2
        const crownDepth = isMolar ? 2.0 : isPremolar ? 1.5 : 1.2

        const toothParent = new THREE.Group()
        toothParent.position.set(x, y, z)
        toothParent.rotation.y = rotY

        const crownGeo = new THREE.CylinderGeometry(
          crownWidth * 0.48,
          crownWidth * 0.4,
          crownHeight,
          isMolar ? 8 : 6
        )
        crownGeo.scale(1, 1, crownDepth / crownWidth)

        let crownMat
        if (renderMode === 'wireframe') {
          crownMat = new THREE.MeshBasicMaterial({
            color: isDetected ? toothColor : 0x243340,
            wireframe: true,
          })
        } else if (renderMode === 'hologram') {
          crownMat = new THREE.MeshStandardMaterial({
            color: toothColor,
            emissive: emissiveColor,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.2,
            metalness: finding.includes('implant') ? 0.9 : 0.2,
            transparent: !isDetected,
            opacity: isDetected ? 0.95 : 0.35,
          })
        } else {
          crownMat = new THREE.MeshStandardMaterial({
            color: isDetected ? (finding !== 'none' ? toothColor : 0xf1f5f9) : 0x334155,
            roughness: 0.3,
            metalness: finding.includes('implant') ? 0.8 : 0.05,
            transparent: !isDetected,
            opacity: isDetected ? 1.0 : 0.4,
          })
        }

        const crownMesh = new THREE.Mesh(crownGeo, crownMat)
        crownMesh.userData = { fdi, isUpper }
        toothParent.add(crownMesh)

        const rootGeo = new THREE.ConeGeometry(crownWidth * 0.3, 2.0, 5)
        rootGeo.rotation.x = isUpper ? 0 : Math.PI
        const rootMesh = new THREE.Mesh(rootGeo, crownMat)
        rootMesh.position.y = isUpper ? 1.6 : -1.6
        toothParent.add(rootMesh)

        if (isDetected) {
          const ringGeo = new THREE.RingGeometry(crownWidth * 0.6, crownWidth * 0.75, 16)
          ringGeo.rotation.x = Math.PI / 2
          const ringMat = new THREE.MeshBasicMaterial({
            color: emissiveColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          })
          const ringMesh = new THREE.Mesh(ringGeo, ringMat)
          ringMesh.position.y = isUpper ? -1.3 : 1.3
          toothParent.add(ringMesh)
        }

        toothParent.userData = { fdi }
        archGroup.add(toothParent)
        toothMeshes.set(fdi, toothParent)
      })

      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      let isDragging = false
      let prevMouseX = 0
      let prevMouseY = 0

      const onPointerDown = (e) => {
        isDragging = true
        prevMouseX = e.clientX
        prevMouseY = e.clientY
      }

      const onPointerMove = (e) => {
        const rect = mount.getBoundingClientRect()
        const w = rect.width || 1
        const h = rect.height || 1
        mouse.x = ((e.clientX - rect.left) / w) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / h) * 2 + 1

        if (isDragging) {
          const deltaX = e.clientX - prevMouseX
          const deltaY = e.clientY - prevMouseY
          archGroup.rotation.y += deltaX * 0.008
          archGroup.rotation.x += deltaY * 0.008
          prevMouseX = e.clientX
          prevMouseY = e.clientY
          return
        }

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(archGroup.children, true)
        if (intersects.length > 0) {
          let current = intersects[0].object
          while (current && !current.userData?.fdi && current.parent) {
            current = current.parent
          }
          if (current && current.userData?.fdi) {
            const fdi = current.userData.fdi
            setHoveredTooth(fdi)
            mount.style.cursor = 'pointer'
            return
          }
        }
        setHoveredTooth(null)
        mount.style.cursor = 'grab'
      }

      const onPointerUp = () => {
        isDragging = false
      }

      const onClick = () => {
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(archGroup.children, true)
        if (intersects.length > 0) {
          let current = intersects[0].object
          while (current && !current.userData?.fdi && current.parent) {
            current = current.parent
          }
          if (current && current.userData?.fdi) {
            const fdi = current.userData.fdi
            const data = toothDataMap.get(fdi) || {
              fdi,
              toothConf: 0,
              finding: 'None',
              findingConf: 0,
              overlap: 0,
            }
            setActiveTooth(data)
            if (onSelectTooth) onSelectTooth(fdi)
          }
        }
      }

      const onWheel = (e) => {
        e.preventDefault()
        camera.position.z = Math.max(16, Math.min(60, camera.position.z + e.deltaY * 0.03))
      }

      mount.addEventListener('pointerdown', onPointerDown)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      mount.addEventListener('click', onClick)
      mount.addEventListener('wheel', onWheel, { passive: false })

      toothMeshes.forEach((mesh, fdi) => {
        const isUpper = fdi < 30
        if (archView === 'upper') {
          mesh.visible = isUpper
        } else if (archView === 'lower') {
          mesh.visible = !isUpper
        } else {
          mesh.visible = true
        }
      })

      const clock = new THREE.Clock()

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        const delta = clock.getDelta()

        if (autoRotate && !isDragging) {
          archGroup.rotation.y += delta * 0.25
        }

        toothMeshes.forEach((mesh, fdi) => {
          const isHovered = hoveredTooth === fdi
          const isSelected = activeTooth?.fdi === fdi
          if (isSelected || isHovered) {
            mesh.scale.set(1.22, 1.22, 1.22)
          } else {
            mesh.scale.set(1, 1, 1)
          }
        })

        renderer.render(scene, camera)
      }

      animate()

      const handleResize = () => {
        if (!mount || !renderer || !camera) return
        const w = Math.max(mount.clientWidth || 600, 200)
        const h = Math.max(mount.clientHeight || 400, 200)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
        mount.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        mount.removeEventListener('click', onClick)
        mount.removeEventListener('wheel', onWheel)
        window.removeEventListener('resize', handleResize)
        if (mount && renderer?.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement)
        }
        renderer?.dispose()
      }
    } catch (err) {
      console.warn('WebGL initialization failed for DentalArch3D:', err)
      setWebglSupported(false)
    }
  }, [toothDataMap, archView, renderMode, autoRotate, hoveredTooth, activeTooth, onSelectTooth])

  return (
    <div className="relative flex flex-col rounded-2xl border border-line bg-[#090f17] overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-[#0e1722]/80 px-4 py-3 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-mint/20 bg-mint/10 text-mint">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="display-font text-sm font-semibold text-slate-100 flex items-center gap-2">
              3D Interactive Dental Arch
              <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-mono text-mint">
                WebGL
              </span>
            </div>
            <div className="text-[10px] text-muted">
              Rotate, inspect FDI teeth and visualize multi-model findings
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line bg-[#090f16] p-0.5 text-[11px]">
            <button
              onClick={() => setArchView('all')}
              className={`rounded px-2.5 py-1 transition ${
                archView === 'all' ? 'bg-[#23343e] text-mint font-medium' : 'text-muted hover:text-white'
              }`}
            >
              Dual Arch
            </button>
            <button
              onClick={() => setArchView('upper')}
              className={`rounded px-2.5 py-1 transition ${
                archView === 'upper' ? 'bg-[#23343e] text-mint font-medium' : 'text-muted hover:text-white'
              }`}
            >
              Upper (11–28)
            </button>
            <button
              onClick={() => setArchView('lower')}
              className={`rounded px-2.5 py-1 transition ${
                archView === 'lower' ? 'bg-[#23343e] text-mint font-medium' : 'text-muted hover:text-white'
              }`}
            >
              Lower (31–48)
            </button>
          </div>

          <div className="flex rounded-lg border border-line bg-[#090f16] p-0.5 text-[11px]">
            <button
              onClick={() => setRenderMode('hologram')}
              className={`rounded px-2 py-1 transition ${
                renderMode === 'hologram' ? 'bg-[#23343e] text-mint' : 'text-muted hover:text-white'
              }`}
              title="Hologram view"
            >
              Holo
            </button>
            <button
              onClick={() => setRenderMode('clinical')}
              className={`rounded px-2 py-1 transition ${
                renderMode === 'clinical' ? 'bg-[#23343e] text-mint' : 'text-muted hover:text-white'
              }`}
              title="Clinical solid view"
            >
              Solid
            </button>
            <button
              onClick={() => setRenderMode('wireframe')}
              className={`rounded px-2 py-1 transition ${
                renderMode === 'wireframe' ? 'bg-[#23343e] text-mint' : 'text-muted hover:text-white'
              }`}
              title="Wireframe view"
            >
              Mesh
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`rounded-lg border border-line p-1.5 text-xs transition ${
              autoRotate ? 'bg-mint/15 text-mint border-mint/40' : 'bg-[#090f16] text-muted hover:text-white'
            }`}
            title="Toggle 3D Orbit Auto-Rotation"
          >
            <RotateCcw size={14} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      <div className="relative h-[380px] sm:h-[430px] w-full cursor-grab bg-gradient-to-b from-[#090f17] to-[#0d1622] select-none">
        <div ref={mountRef} className="absolute inset-0" />

        {!webglSupported && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#090f17]/90 backdrop-blur-md">
            <div>
              <Box size={32} className="mx-auto text-mint opacity-80" />
              <div className="mt-3 text-sm font-semibold text-slate-200">
                WebGL Acceleration Disabled or Unavailable
              </div>
              <p className="mt-1 text-xs text-muted max-w-sm">
                Switch to the "2D FDI Matrix" tab above to view findings across all 32 teeth without hardware acceleration.
              </p>
            </div>
          </div>
        )}

        {hoveredTooth && (
          <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-mint/30 bg-[#0d1622]/90 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-mint/20 text-xs font-bold text-mint font-mono">
                {hoveredTooth}
              </span>
              <span className="text-xs font-semibold text-slate-100">
                {FDI_ANATOMICAL_NAMES[hoveredTooth]}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-muted">
              {toothDataMap.has(hoveredTooth) ? (
                <span className="text-emerald-400 font-medium">Detected in X-Ray • Click to inspect</span>
              ) : (
                <span className="text-slate-400">Undetected / Reference position</span>
              )}
            </div>
          </div>
        )}

        {activeTooth && (
          <div className="absolute right-4 top-4 z-20 max-w-[280px] animate-in rounded-xl border border-line bg-[#0e1824]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-mint/30 bg-mint/15 font-mono text-sm font-bold text-mint">
                  {activeTooth.fdi}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">FDI {activeTooth.fdi}</div>
                  <div className="text-[10px] leading-3 text-muted">
                    {FDI_ANATOMICAL_NAMES[activeTooth.fdi]}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTooth(null)}
                className="rounded-lg p-1 text-muted hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 border-t border-line/70 pt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted text-[11px]">Detection Conf</span>
                <span className="font-mono text-slate-200">
                  {activeTooth.toothConf ? `${(activeTooth.toothConf * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-[11px]">Primary Finding</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    activeTooth.finding.toLowerCase().includes('caries')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : activeTooth.finding.toLowerCase().includes('implant')
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : activeTooth.finding.toLowerCase().includes('filling') ||
                        activeTooth.finding.toLowerCase().includes('composite')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : activeTooth.finding.toLowerCase().includes('crown')
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : activeTooth.toothConf
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700/30 text-slate-400'
                  }`}
                >
                  {activeTooth.finding !== 'None' ? activeTooth.finding : 'Healthy / None'}
                </span>
              </div>
              {activeTooth.findingConf > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted text-[11px]">Finding Conf</span>
                  <span className="font-mono text-slate-200">
                    {(activeTooth.findingConf * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {activeTooth.overlap > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted text-[11px]">Mask Overlap</span>
                  <span className="font-mono text-slate-200">
                    {(activeTooth.overlap * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-[#090f16]/80 px-3 py-2 text-[10px] backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#72E3D0]" /> Healthy
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Caries
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Implant
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Filling / Comp
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#A855F7]" /> Crown
            </span>
          </div>
          <span className="text-muted hidden sm:inline">Drag to rotate • Scroll to zoom</span>
        </div>
      </div>
    </div>
  )
}
