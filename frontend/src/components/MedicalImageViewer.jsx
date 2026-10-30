import React, { useState, useRef, useEffect } from 'react'
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  X
} from 'lucide-react'

export default function MedicalImageViewer({
  result,
  isAnalyzing = false,
  onDownloadAnnotated,
}) {
  const [viewMode, setViewMode] = useState('split') // 'split' | 'side' | 'annotated' | 'original'
  const [splitPos, setSplitPos] = useState(50) // 0 to 100 percentage
  const [zoomLevel, setZoomLevel] = useState(1) // 1x to 3x
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [fullscreen, setFullscreen] = useState(false)

  const containerRef = useRef(null)
  const isDraggingSplit = useRef(false)

  const originalSrc = result?.original_image
    ? `data:image/png;base64,${result.original_image}`
    : null
  const annotatedSrc = result?.annotated_image
    ? `data:image/png;base64,${result.annotated_image}`
    : null

  // Split-wipe drag handlers
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

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3, +(prev + 0.25).toFixed(2)))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(1, +(prev - 0.25).toFixed(2)))
  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Pan handlers when zoomed
  const handleMouseDownPan = (e) => {
    if (zoomLevel <= 1 || isDraggingSplit.current) return
    setIsPanning(true)
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMovePan = (e) => {
    if (!isPanning || zoomLevel <= 1) return
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    })
  }

  const handleMouseUpPan = () => {
    setIsPanning(false)
  }

  // Keyboard accessibility for split divider
  const handleKeyDownSplit = (e) => {
    if (e.key === 'ArrowLeft') {
      setSplitPos((prev) => Math.max(0, prev - 5))
    } else if (e.key === 'ArrowRight') {
      setSplitPos((prev) => Math.min(100, prev + 5))
    }
  }

  const hasImage = Boolean(originalSrc || annotatedSrc)

  return (
    <div className="rounded-xl border border-[#1E2638] bg-[#111622] overflow-hidden flex flex-col">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2638] bg-[#0E131F] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161D2D] text-blue-400 border border-[#1E2638]">
            <ImageIcon size={15} />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              Radiograph Canvas
              {isAnalyzing && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" /> Analyzing radiograph…
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* View Mode and Inspection Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasImage && (
            <>
              {/* View Selector Tabs */}
              <div className="flex rounded-lg border border-[#1E2638] bg-[#0A0D14] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    viewMode === 'split'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Draggable Split-Wipe Comparison"
                >
                  Split Wipe
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('side')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    viewMode === 'side'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Side-by-Side Dual View"
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    viewMode === 'annotated'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="AI Annotated View"
                >
                  Annotated
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    viewMode === 'original'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Source Radiograph Only"
                >
                  Source
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-[#1E2638] pl-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="rounded p-1 text-slate-400 hover:bg-[#161D2D] hover:text-white disabled:opacity-30"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="px-1 text-[11px] font-mono text-slate-400 w-9 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="rounded p-1 text-slate-400 hover:bg-[#161D2D] hover:text-white disabled:opacity-30"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
                  className="rounded p-1 text-slate-400 hover:bg-[#161D2D] hover:text-white disabled:opacity-30 ml-0.5"
                  title="Reset Zoom & Pan"
                  aria-label="Reset View"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Fullscreen & Download */}
              <div className="flex items-center gap-1 border-l border-[#1E2638] pl-2">
                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="rounded p-1 text-slate-400 hover:bg-[#161D2D] hover:text-white"
                  title="Fullscreen View"
                  aria-label="Fullscreen View"
                >
                  <Maximize2 size={15} />
                </button>
                {annotatedSrc && (
                  <button
                    type="button"
                    onClick={onDownloadAnnotated}
                    className="rounded p-1 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition ml-0.5"
                    title="Download Annotated PNG"
                    aria-label="Download Annotated Image"
                  >
                    <Download size={15} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative min-h-[360px] sm:min-h-[460px] max-h-[640px] bg-[#070A10] flex items-center justify-center overflow-hidden select-none p-3"
        onMouseDown={handleMouseDownPan}
        onMouseMove={handleMouseMovePan}
        onMouseUp={handleMouseUpPan}
        style={{ cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        {!hasImage ? (
          /* Empty State */
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#111622] border border-[#1E2638] text-slate-500 mb-4">
              <ImageIcon size={26} strokeWidth={1.5} />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1.5">
              No Radiograph Uploaded
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select or drop a panoramic dental X-ray in the ingestion panel on the left to begin multi-model inference.
            </p>
          </div>
        ) : viewMode === 'split' && annotatedSrc ? (
          /* Split-Wipe Draggable View */
          <div
            ref={containerRef}
            className="relative w-full h-full max-h-[600px] flex items-center justify-center overflow-hidden"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Background: Annotated Result */}
            <img
              src={annotatedSrc}
              alt="PERLNEST Model Annotations"
              className="max-h-[580px] w-full object-contain pointer-events-none"
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
                alt="Source Panoramic Radiograph"
                className="max-h-[580px] w-full object-contain pointer-events-none"
              />
            </div>

            {/* Split Divider */}
            <div
              tabIndex={0}
              role="slider"
              aria-label="Split comparison divider"
              aria-valuenow={Math.round(splitPos)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={handleKeyDownSplit}
              className="absolute top-0 bottom-0 z-20 w-0.5 bg-blue-500 cursor-ew-resize flex items-center justify-center focus:outline-none"
              style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              onMouseDown={handleSplitDown}
            >
              <div className="h-7 w-7 rounded-full border border-blue-400 bg-[#0A0D14] text-white shadow-md grid place-items-center text-[10px] font-bold">
                ⬌
              </div>
            </div>

            {/* Badges */}
            <div className="absolute left-3 top-3 z-10 rounded border border-[#1E2638] bg-[#0A0D14]/90 px-2 py-0.5 text-[10px] font-mono text-slate-300 pointer-events-none">
              SOURCE
            </div>
            <div className="absolute right-3 top-3 z-10 rounded border border-blue-500/30 bg-[#0A0D14]/90 px-2 py-0.5 text-[10px] font-mono text-blue-400 pointer-events-none">
              ANNOTATED
            </div>
          </div>
        ) : viewMode === 'side' && annotatedSrc ? (
          /* Side by Side Dual View */
          <div
            className="grid gap-3 w-full max-h-[600px] md:grid-cols-2"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="rounded-xl border border-[#1E2638] bg-[#0A0D14] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1E2638] px-3 py-1.5 text-xs">
                <span className="text-slate-300 text-[11px] font-medium">Source Radiograph</span>
                <span className="rounded bg-[#161D2D] px-1.5 py-0.5 text-[9px] font-mono text-slate-400">RAW</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 min-h-[220px]">
                <img src={originalSrc} alt="Source X-Ray" className="max-h-[500px] w-full object-contain" />
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-[#0A0D14] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1E2638] px-3 py-1.5 text-xs">
                <span className="text-blue-400 text-[11px] font-medium">Model Annotations</span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-mono text-blue-400">OUTPUT</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 min-h-[220px]">
                <img src={annotatedSrc} alt="Annotated X-Ray" className="max-h-[500px] w-full object-contain" />
              </div>
            </div>
          </div>
        ) : (
          /* Single Image (Annotated or Original) */
          <div
            className="relative w-full h-full max-h-[600px] flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <img
              src={viewMode === 'original' ? originalSrc : annotatedSrc || originalSrc}
              alt="Panoramic View"
              className="max-h-[580px] w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Viewer Footer Status & Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E2638] bg-[#0E131F] px-4 py-2 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-300">Color Key:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tooth Box (Green)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Caries Mask (Red)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Implant (Blue)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Filling (Amber)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Crown (Purple)
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {zoomLevel > 1 ? `Pan active • Drag to inspect (${Math.round(zoomLevel * 100)}%)` : 'Panoramic Orthopantomogram (OPG)'}
        </div>
      </div>

      {/* Fullscreen Modal Lightbox */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#070A10]/95 backdrop-blur-md p-4"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div className="text-xs font-semibold text-white">High-Resolution Radiograph Lightbox</div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#161D2D] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={annotatedSrc || originalSrc}
              alt="Fullscreen Radiograph"
              className="max-h-[88vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
