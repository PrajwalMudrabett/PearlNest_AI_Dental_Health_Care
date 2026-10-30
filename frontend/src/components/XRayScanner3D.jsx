import React, { useState, useRef, useEffect } from 'react'
import {
  Image as ImageIcon,
  Sliders,
  Scan,
  Maximize2,
  Minimize2,
  ZoomIn,
  Sparkles,
  Contrast,
  Eye,
  EyeOff,
  Layers,
  X,
  Crosshair,
  Activity,
  FileCheck2,
  CheckCircle2,
  Cpu
} from 'lucide-react'

export default function XRayScanner3D({ result, isScanning = false }) {
  const [viewMode, setViewMode] = useState('split') // 'split' | 'side' | 'annotated' | 'original'
  const [splitPos, setSplitPos] = useState(50)
  const [filterMode, setFilterMode] = useState('normal') // 'normal' | 'invert' | 'contrast' | 'clahe'
  const [enableLaser, setEnableLaser] = useState(true)
  const [showLoupe, setShowLoupe] = useState(false)
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, relX: 0, relY: 0 })
  const [fullscreen, setFullscreen] = useState(false)

  const containerRef = useRef(null)
  const isDraggingSplit = useRef(false)

  const originalSrc = result?.original_image ? `data:image/png;base64,${result.original_image}` : null
  const annotatedSrc = result?.annotated_image ? `data:image/png;base64,${result.annotated_image}` : null

  const handleSplitDown = (e) => {
    isDraggingSplit.current = true
    e.preventDefault()
  }

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingSplit.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      setSplitPos((x / rect.width) * 100)
    }

    const handleUp = () => {
      isDraggingSplit.current = false
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const relX = (x / rect.width) * 100
    const relY = (y / rect.height) * 100
    setLoupePos({ x, y, relX, relY })
  }

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'invert':
        return 'invert(90%) hue-rotate(180deg) contrast(125%)'
      case 'contrast':
        return 'contrast(175%) brightness(92%) saturate(115%)'
      case 'clahe':
        return 'contrast(140%) brightness(105%) hue-rotate(15deg) saturate(135%)'
      default:
        return 'none'
    }
  }

  return (
    <div className="rounded-3xl border border-[#2a3e52]/80 bg-gradient-to-b from-[#0f1926]/90 to-[#0a111a]/95 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24374a]/80 bg-[#0c1420]/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-mint shadow-[0_0_20px_rgba(13,242,201,0.2)]">
            <Scan size={20} />
          </div>
          <div>
            <div className="display-font text-base font-bold text-white flex items-center gap-2">
              Radiographic Diagnostic Workspace
              {isScanning ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/20 border border-mint/40 px-2.5 py-0.5 text-[10px] text-mint font-mono animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-mint pulse-glow" /> SCANNING INFERENCE
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] text-emerald-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> READY
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-muted">
              Interactive split compare, multi-spectral filters and precision loupe inspection
            </p>
          </div>
        </div>

        {/* Workspace Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="flex rounded-xl border border-line bg-[#080e16] p-1 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`rounded-lg px-3 py-1.5 transition font-medium ${
                viewMode === 'split'
                  ? 'bg-gradient-to-r from-mint/20 to-sky-500/20 text-mint border border-mint/30 shadow-sm'
                  : 'text-muted hover:text-white'
              }`}
            >
              Split Wipe
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`rounded-lg px-3 py-1.5 transition font-medium ${
                viewMode === 'side'
                  ? 'bg-gradient-to-r from-mint/20 to-sky-500/20 text-mint border border-mint/30 shadow-sm'
                  : 'text-muted hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('annotated')}
              className={`rounded-lg px-3 py-1.5 transition font-medium ${
                viewMode === 'annotated'
                  ? 'bg-gradient-to-r from-mint/20 to-sky-500/20 text-mint border border-mint/30 shadow-sm'
                  : 'text-muted hover:text-white'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`rounded-lg px-3 py-1.5 transition font-medium ${
                viewMode === 'original'
                  ? 'bg-gradient-to-r from-mint/20 to-sky-500/20 text-mint border border-mint/30 shadow-sm'
                  : 'text-muted hover:text-white'
              }`}
            >
              Source
            </button>
          </div>

          {/* Diagnostic Filters */}
          <div className="flex rounded-xl border border-line bg-[#080e16] p-1 text-xs">
            <button
              onClick={() => setFilterMode('normal')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                filterMode === 'normal' ? 'bg-[#223545] text-mint font-semibold' : 'text-muted hover:text-white'
              }`}
              title="Standard Radiograph"
            >
              Natural
            </button>
            <button
              onClick={() => setFilterMode('contrast')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                filterMode === 'contrast' ? 'bg-[#223545] text-mint font-semibold' : 'text-muted hover:text-white'
              }`}
              title="Bone Density Contrast Enhancement"
            >
              Bone
            </button>
            <button
              onClick={() => setFilterMode('invert')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                filterMode === 'invert' ? 'bg-[#223545] text-mint font-semibold' : 'text-muted hover:text-white'
              }`}
              title="Inverted Radiographic Negative Film"
            >
              Invert
            </button>
          </div>

          {/* Tool buttons */}
          <button
            onClick={() => setShowLoupe(!showLoupe)}
            className={`rounded-xl border p-2 text-xs transition ${
              showLoupe
                ? 'bg-mint/20 text-mint border-mint/50 shadow-[0_0_15px_rgba(13,242,201,0.25)]'
                : 'border-line bg-[#080e16] text-muted hover:text-white'
            }`}
            title="Toggle 2.5x Diagnostic Reticle Loupe"
          >
            <Crosshair size={16} />
          </button>

          <button
            onClick={() => setEnableLaser(!enableLaser)}
            className={`rounded-xl border p-2 text-xs transition ${
              enableLaser
                ? 'bg-mint/20 text-mint border-mint/50 shadow-[0_0_15px_rgba(13,242,201,0.25)]'
                : 'border-line bg-[#080e16] text-muted hover:text-white'
            }`}
            title="Toggle Holographic Laser Beam"
          >
            <Scan size={16} />
          </button>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded-xl border border-line bg-[#080e16] p-2 text-muted hover:text-white transition"
            title="Open High-Res Lightbox"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Display Container */}
      <div className="p-5 bg-[#060b12] relative">
        {!originalSrc ? (
          <div className="grid min-h-[350px] sm:min-h-[420px] place-items-center rounded-2xl border-2 border-dashed border-[#24374a] bg-[#09101a] p-10 text-center cyber-grid relative overflow-hidden">
            <div className="relative z-10 max-w-md mx-auto">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-mint/20 via-sky-500/10 to-transparent text-mint border border-mint/30 shadow-[0_0_35px_rgba(13,242,201,0.25)]">
                <ImageIcon size={30} />
              </div>
              <h4 className="mt-5 text-base font-bold text-white tracking-wide">
                Awaiting Panoramic X-Ray Scan
              </h4>
              <p className="mt-2 text-xs text-muted leading-6">
                Upload a panoramic radiograph using the panel on the left to initiate Model 1 (FDI teeth), Model 2 (caries segmentation), and Model 3 (dental restorations).
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> 32 FDI Classes</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Caries Mask</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> 5 Findings</span>
              </div>
            </div>
          </div>
        ) : viewMode === 'split' && annotatedSrc ? (
          /* Split View Slider */
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[340px] max-h-[580px] overflow-hidden rounded-2xl border border-line bg-black select-none cursor-crosshair group shadow-2xl"
            style={{ filter: getFilterStyle() }}
          >
            {/* Corner reticle decorations */}
            <div className="reticle-corner top-3 left-3 border-t-2 border-l-2" />
            <div className="reticle-corner top-3 right-3 border-t-2 border-r-2" />
            <div className="reticle-corner bottom-3 left-3 border-b-2 border-l-2" />
            <div className="reticle-corner bottom-3 right-3 border-b-2 border-r-2" />

            {/* Background: Annotated Deep Learning Image */}
            <img
              src={annotatedSrc}
              alt="PERLNEST Model Annotations"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Foreground: Clipped Original Image */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `polygon(0% 0%, ${splitPos}% 0%, ${splitPos}% 100%, 0% 100%)`,
              }}
            >
              <img
                src={originalSrc}
                alt="Original Radiograph"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Neon Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 z-20 w-1 bg-mint shadow-[0_0_20px_#0df2c9] cursor-ew-resize flex items-center justify-center"
              style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              onMouseDown={handleSplitDown}
            >
              <div className="h-9 w-9 rounded-full border-2 border-mint bg-[#07121b] text-mint shadow-[0_0_20px_rgba(13,242,201,0.5)] grid place-items-center text-[11px] font-bold">
                ⬌
              </div>
            </div>

            {/* HUD Labels */}
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-line bg-black/75 px-3 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur-md">
              SOURCE X-RAY
            </div>
            <div className="absolute right-4 top-4 z-10 rounded-lg border border-mint/40 bg-black/75 px-3 py-1.5 text-[10px] font-mono text-mint backdrop-blur-md">
              AI INFERENCE MASK
            </div>

            {/* Laser scanning beam */}
            {enableLaser && (
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-90 shadow-[0_0_25px_#0df2c9] laser-beam z-15" />
            )}

            {/* Precision Magnifier Loupe */}
            {showLoupe && (
              <div
                className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-mint shadow-[0_0_35px_rgba(13,242,201,0.6)] overflow-hidden z-30"
                style={{
                  left: `${loupePos.x}px`,
                  top: `${loupePos.y}px`,
                  backgroundImage: `url(${annotatedSrc || originalSrc})`,
                  backgroundPosition: `${loupePos.relX}% ${loupePos.relY}%`,
                  backgroundSize: '260%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* Loupe Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-mint/40" />
                  <div className="h-full w-px bg-mint/40 absolute" />
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/80 border border-mint/40 px-1.5 py-0.5 text-[9px] text-mint font-mono font-bold">
                  2.5x ZOOM
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'side' && annotatedSrc ? (
          /* Dual Side by Side */
          <div className="grid gap-4 md:grid-cols-2" style={{ filter: getFilterStyle() }}>
            <div className="overflow-hidden rounded-2xl border border-line bg-[#080f17]">
              <div className="flex items-center justify-between border-b border-line/80 px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-200">Raw Radiograph</span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-muted font-mono">SOURCE</span>
              </div>
              <div className="flex min-h-[260px] max-h-[500px] items-center justify-center p-3 bg-black/40">
                <img src={originalSrc} alt="Source X-Ray" className="max-h-[460px] w-full object-contain" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-mint/30 bg-[#080f17]">
              <div className="flex items-center justify-between border-b border-line/80 px-4 py-2.5 text-xs">
                <span className="font-semibold text-mint">PERLNEST Multi-Model Segmentation</span>
                <span className="rounded bg-mint/15 px-2 py-0.5 text-[10px] text-mint font-mono font-bold">AI OVERLAY</span>
              </div>
              <div className="flex min-h-[260px] max-h-[500px] items-center justify-center p-3 bg-black/40 relative">
                <img src={annotatedSrc} alt="Annotated X-Ray" className="max-h-[460px] w-full object-contain" />
                {enableLaser && (
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-85 shadow-[0_0_20px_#0df2c9] laser-beam" />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single Image View */
          <div
            className="relative min-h-[340px] max-h-[580px] overflow-hidden rounded-2xl border border-line bg-black flex items-center justify-center p-2"
            style={{ filter: getFilterStyle() }}
          >
            <img
              src={viewMode === 'original' ? originalSrc : annotatedSrc || originalSrc}
              alt="Panoramic View"
              className="max-h-[540px] w-full object-contain"
            />
            {enableLaser && (
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-85 shadow-[0_0_20px_#0df2c9] laser-beam" />
            )}
          </div>
        )}
      </div>

      {/* Footer Status & Color Legend */}
      {result && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/80 bg-[#09101a] px-6 py-3.5 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-glow" /> 3-Model Pipeline Executed
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" /> Green: FDI Tooth
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Red: Caries
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Blue: Implant
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Amber: Filling
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#a855f7]" /> Purple: Crown
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Click loupe icon above for 2.5x magnification lens
          </span>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-2xl"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute right-6 top-6 rounded-2xl border border-white/20 bg-white/10 p-3 text-white hover:bg-white/20 transition"
          >
            <X size={24} />
          </button>
          <img
            src={annotatedSrc || originalSrc}
            alt="Fullscreen Radiograph"
            className="max-h-[92vh] max-w-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
