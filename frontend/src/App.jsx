import React, { useEffect, useState, useMemo, useRef } from 'react'
import { NavLink, Route, Routes, useLocation, Link } from 'react-router-dom'
import {
  ScanLine,
  Gauge,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  CircleHelp,
  Menu,
  X,
  Stethoscope,
  Activity,
  ArrowRight
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import LandingPage from './components/LandingPage'
import MedicalImageViewer from './components/MedicalImageViewer'
import AnalysisSummaryGrid from './components/AnalysisSummaryGrid'
import FindingsDataTable from './components/FindingsDataTable'
import ThreeDBackground from './components/ThreeDBackground'

const navItems = [
  { to: '/', label: 'Overview', icon: Sparkles, end: true },
  { to: '/studio', label: 'AI Studio', icon: ScanLine },
  { to: '/benchmarks', label: 'Model Benchmarks', icon: Gauge },
  { to: '/architecture', label: 'Architecture & Scope', icon: BookOpen },
]

const emptySummary = {
  teeth_detected: 0,
  caries_assignments: 0,
  implant_assignments: 0,
  filling_assignments: 0,
  composite_assignments: 0,
  amalgam_assignments: 0,
  crown_assignments: 0,
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`
}

/* -------------------------------------------------------------------------- */
/*                               APPLICATION SHELL                            */
/* -------------------------------------------------------------------------- */

function Sidebar({ open, onClose, isApiOnline }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[#1E2638] bg-[#0C101A] px-4 py-5 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 px-2">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/30 bg-[#0E1524] shadow-sm">
            <img
              src="/logo.png"
              alt="PERLNEST Logo"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white">
              PERLNEST
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Dental AI Research
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-[#161D2D] lg:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </Link>

        {/* Navigation */}
        <div className="mt-8 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-[#111622] hover:text-white'
                )
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom System Status */}
        <div className="mt-auto border-t border-[#1E2638] pt-4 space-y-2">
          {/* API Status Indicator */}
          <div className="flex items-center gap-2 rounded-lg border border-[#1E2638] bg-[#111622] px-3 py-2 text-xs">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isApiOnline ? 'bg-emerald-400' : 'bg-rose-400'
              )}
            />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-200 truncate">
                {isApiOnline ? 'Flask API Online' : 'API Unreachable'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Port 5000 Proxy</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 text-[10px] text-slate-500">
            <ShieldCheck size={13} className="text-slate-400 shrink-0" />
            <span>Research Mode • Non-Clinical</span>
          </div>
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenu, isApiOnline }) {
  const location = useLocation()
  const currentTitle = navItems.find((n) => n.to === location.pathname)?.label || 'Dental AI'

  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b border-[#1E2638] bg-[#0A0D14]/90 px-4 backdrop-blur-md sm:px-7 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg border border-[#1E2638] p-1.5 text-slate-400 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="text-[11px] text-slate-500">
            <span>PERLNEST</span>
            <span className="mx-1 text-[#1E2638]">/</span>
            <span className="text-slate-400">{currentTitle}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {currentTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#1E2638] bg-[#111622] px-3 py-1 text-xs text-slate-300">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isApiOnline ? 'bg-emerald-400' : 'bg-rose-400'
            )}
          />
          {isApiOnline ? 'API Connected' : 'API Offline'}
        </span>

        {location.pathname !== '/studio' && (
          <Link
            to="/studio"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-sm"
          >
            <span>Launch Studio</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </header>
  )
}

function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-800 bg-[#111622] p-4 text-xs leading-5 text-slate-400">
      <CircleHelp className="shrink-0 text-slate-400 mt-0.5" size={16} />
      <div>
        <span className="font-semibold text-slate-200">Research & Educational Prototype: </span>
        PERLNEST is an experimental research system. Model predictions and tooth-wise assignments are intended strictly for computational study and do not constitute clinical diagnosis or a substitute for professional dental evaluation.
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                     PAGE ONE: X-RAY ANALYSIS WORKSTATION                   */
/* -------------------------------------------------------------------------- */

function AnalysisPage({ isApiOnline }) {
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Confidence slider parameters
  const [conf, setConf] = useState({
    model1_conf: 0.25,
    model2_conf: 0.25,
    model3_conf: 0.50,
  })

  const fileInputRef = useRef(null)

  const handleFileSelect = (picked) => {
    if (!picked) return
    if (!['image/jpeg', 'image/png'].includes(picked.type)) {
      setError('Unsupported file type. Please upload a JPG or PNG radiograph.')
      return
    }
    if (picked.size > 20 * 1024 * 1024) {
      setError('File exceeds 20 MB upload limit.')
      return
    }

    setFile(picked)
    setFilePreview(URL.createObjectURL(picked))
    setResult(null)
    setError('')
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFilePreview(null)
    setResult(null)
    setError('')
  }

  // Load sample demo image with 1 click
  const handleLoadSample = async () => {
    try {
      const res = await fetch('/sample_xray.jpg')
      if (!res.ok) throw new Error('Could not fetch sample')
      const blob = await res.blob()
      const sampleFile = new File([blob], 'demo_panoramic_opg.jpg', { type: 'image/jpeg' })
      handleFileSelect(sampleFile)
    } catch {
      setError('Demo sample radiograph is unavailable.')
    }
  }

  async function handleRunAnalysis() {
    if (!file) return
    setBusy(true)
    setError('')

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('model1_conf', String(conf.model1_conf))
      body.append('model2_conf', String(conf.model2_conf))
      body.append('model3_conf', String(conf.model3_conf))

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body,
      })

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        const preview = responseText.slice(0, 200).trim()
        throw new Error(
          `Server returned an invalid response (HTTP ${response.status}). ${preview ? `Detail: ${preview}` : ''}`
        )
      }

      if (!response.ok) {
        throw new Error(data.error || data.detail || `Analysis request failed (HTTP ${response.status})`)
      }

      setResult(data)
    } catch (err) {
      setError(
        err?.message || 'Inference request failed. Confirm the Flask API server is active at http://127.0.0.1:5000.'
      )
    } finally {
      setBusy(false)
    }
  }

  // Export handlers
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAnnotated = () => {
    if (!result?.annotated_image) return
    const bytes = Uint8Array.from(atob(result.annotated_image), (c) => c.charCodeAt(0))
    downloadFile(new Blob([bytes], { type: 'image/png' }), 'perlnest-annotated-radiograph.png')
  }

  const handleExportCsv = () => {
    const rows = result?.rows || []
    if (rows.length === 0) return
    const columns = Object.keys(rows[0])
    const csvContent = [
      columns.join(','),
      ...rows.map((row) =>
        columns
          .map((col) => {
            const val = row[col] ?? ''
            return `"${String(val).replaceAll('"', '""')}"`
          })
          .join(',')
      ),
    ].join('\r\n')

    downloadFile(
      new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }),
      'perlnest-toothwise-findings.csv'
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Intro */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end border-b border-[#1E2638] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Panoramic X-Ray Analysis
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Analyze dental radiographs using tooth detection, caries segmentation, and tooth-wise findings association.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#111622] px-3 py-1.5 text-xs font-semibold text-blue-400 hover:border-slate-700 hover:bg-[#161D2D] transition"
          >
            <Sparkles size={13} />
            <span>Load Demo Radiograph</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload & Configuration + Imaging Workspace */}
      <div className="grid gap-6 lg:grid-cols-[minmax(310px,360px)_minmax(0,1fr)]">
        {/* Left Column: Upload & Inference Configuration */}
        <div className="space-y-4">
          {/* Upload Card */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-white mb-1">Radiograph Ingestion</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Select or drop a panoramic orthopantomogram (OPG).
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                handleFileSelect(e.dataTransfer.files?.[0])
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'cursor-pointer rounded-xl border border-dashed border-[#1E2638] bg-[#0A0D14] p-6 text-center transition hover:border-blue-500 hover:bg-[#0E131F]',
                dragActive && 'drop-active'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#161D2D] text-blue-400 border border-[#1E2638] mb-3">
                <UploadCloud size={20} />
              </div>

              <div className="text-xs font-medium text-white">
                {file ? file.name : 'Drop a panoramic X-ray here'}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace`
                  : 'Supported formats: JPG, JPEG, PNG (max 20 MB)'}
              </p>

              <button
                type="button"
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#161D2D] px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition"
              >
                <Search size={13} />
                <span>Browse Files</span>
              </button>
            </div>

            {/* Selected File Details */}
            {file && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#1E2638] bg-[#0A0D14] p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {filePreview && (
                    <img
                      src={filePreview}
                      alt="Thumbnail"
                      className="h-8 w-10 object-cover rounded border border-[#1E2638]"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                  title="Remove Selected Image"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <div>{error}</div>
              </div>
            )}
          </div>

          {/* Configuration Card */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-white mb-1">Inference Parameters</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Confidence thresholds applied to the three YOLO inference models.
            </p>

            <div className="space-y-3.5">
              {/* Model 1 Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 text-[11px]">Tooth Detection (Model 1)</span>
                  <span className="font-mono text-blue-400 font-semibold text-xs">
                    {conf.model1_conf.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={conf.model1_conf}
                  onChange={(e) =>
                    setConf((prev) => ({ ...prev, model1_conf: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                  <span>0.05</span>
                  <span>0.95</span>
                </div>
              </div>

              {/* Model 2 Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 text-[11px]">Caries Segmentation (Model 2)</span>
                  <span className="font-mono text-blue-400 font-semibold text-xs">
                    {conf.model2_conf.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={conf.model2_conf}
                  onChange={(e) =>
                    setConf((prev) => ({ ...prev, model2_conf: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                  <span>0.05</span>
                  <span>0.95</span>
                </div>
              </div>

              {/* Model 3 Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 text-[11px]">Findings Segmentation (Model 3)</span>
                  <span className="font-mono text-blue-400 font-semibold text-xs">
                    {conf.model3_conf.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={conf.model3_conf}
                  onChange={(e) =>
                    setConf((prev) => ({ ...prev, model3_conf: Number(e.target.value) }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                  <span>0.05</span>
                  <span>0.95</span>
                </div>
              </div>
            </div>

            {/* Run Analysis Action */}
            <button
              type="button"
              disabled={!file || busy}
              onClick={handleRunAnalysis}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Analyzing radiograph…</span>
                </>
              ) : (
                <span>Run Analysis</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Medical Image Workspace */}
        <div className="min-w-0">
          <MedicalImageViewer
            result={result}
            isAnalyzing={busy}
            onDownloadAnnotated={handleDownloadAnnotated}
          />
        </div>
      </div>

      {/* Analysis Summary Row */}
      <AnalysisSummaryGrid
        summary={result?.summary || emptySummary}
        hasResult={Boolean(result)}
      />

      {/* Tooth-Wise Findings Table */}
      <FindingsDataTable
        rows={result?.rows || []}
        onExportCsv={handleExportCsv}
        isExportDisabled={!result || (result?.rows || []).length === 0}
      />

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                     PAGE TWO: MODEL BENCHMARKS                             */
/* -------------------------------------------------------------------------- */

function BenchmarksPage() {
  const [models, setModels] = useState([])
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  const officialBenchmarks = [
    {
      id: 'tooth',
      name: 'Tooth Detection & FDI',
      architecture: 'YOLOv8n Object Detection • 32 FDI Classes',
      test_images: 28,
      instances: 690,
      metrics: {
        Precision: 95.4,
        Recall: 95.0,
        'mAP@50': 97.9,
        'mAP@50-95': 67.2,
      },
      note: 'Held-out test set contains 28 X-rays.',
    },
    {
      id: 'caries',
      name: 'Caries Segmentation',
      architecture: 'YOLOv8n-Seg Instance Segmentation • 1 Class',
      test_images: 53,
      instances: 53,
      metrics: {
        'Mask Precision': 98.1,
        'Mask Recall': 99.4,
        'Mask mAP@50': 99.3,
        'Mask mAP@50-95': 70.5,
      },
      note: 'Held-out test set contains 53 images and 53 instances.',
    },
    {
      id: 'findings',
      name: 'Dental Findings Segmentation',
      architecture: 'YOLOv8n-Seg Instance Segmentation • 5 Classes',
      test_images: 130,
      instances: 3651,
      metrics: {
        'Mask Precision': 73.3,
        'Mask Recall': 73.6,
        'Mask mAP@50': 75.2,
        'Mask mAP@50-95': 53.2,
      },
      note: 'Random image-level split (seed 42); patient-level separation not established.',
    },
  ]

  useEffect(() => {
    fetch('/api/performance')
      .then((res) => {
        if (!res.ok) throw new Error('API performance endpoint returned non-200 status.')
        return res.json()
      })
      .then((data) => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models)
          setIsUsingFallback(false)
        } else {
          setModels(officialBenchmarks)
          setIsUsingFallback(true)
        }
      })
      .catch(() => {
        setModels(officialBenchmarks)
        setIsUsingFallback(true)
      })
  }, [])

  const displayModels = models.length > 0 ? models : officialBenchmarks

  const chartData = displayModels.map((m) => ({
    name: m.id === 'tooth' ? 'Tooth Detection' : m.id === 'caries' ? 'Caries Seg' : 'Findings Seg',
    Precision: m.metrics.Precision ?? m.metrics['Mask Precision'] ?? 0,
    Recall: m.metrics.Recall ?? m.metrics['Mask Recall'] ?? 0,
    'mAP@50': m.metrics['mAP@50'] ?? m.metrics['Mask mAP@50'] ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2638] pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Model Benchmarks
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Recorded evaluation metrics obtained from independent held-out test splits for the three designated models.
        </p>
      </div>

      {isUsingFallback && (
        <div className="rounded-lg border border-[#1E2638] bg-[#111622] p-3 text-xs text-slate-400 flex items-center gap-2">
          <Info size={14} className="text-blue-400 shrink-0" />
          <span>Displaying verified held-out evaluation benchmarks from project handoff records.</span>
        </div>
      )}

      {/* Model Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {displayModels.map((m) => (
          <div key={m.id} className="rounded-xl border border-[#1E2638] bg-[#111622] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-400 font-mono uppercase">
                  {m.id === 'tooth' ? 'Model 1' : m.id === 'caries' ? 'Model 2' : 'Model 3'}
                </span>
                <span className="rounded bg-[#0A0D14] px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-[#1E2638]">
                  {m.test_images} Test Images
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white">{m.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{m.architecture}</p>

              {/* Metric rows */}
              <div className="mt-4 space-y-2.5">
                {Object.entries(m.metrics).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 text-[11px]">{label}</span>
                      <span className="font-mono text-white font-semibold text-xs">
                        {formatPercent(val)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#161D2D] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-[#1E2638] pt-3 text-[10px] leading-4 text-slate-400">
              {m.instances.toLocaleString()} test instances • {m.note}
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Chart */}
      <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-5">
        <h3 className="text-xs font-semibold text-white mb-1">Cross-Model Comparison</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Independent held-out test splits for precision, recall, and mAP@50.
        </p>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1E2638" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E131F',
                  border: '1px solid #1E2638',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#F1F5F9',
                }}
                formatter={(val) => `${Number(val).toFixed(1)}%`}
              />
              <Bar dataKey="Precision" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Recall" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="mAP@50" fill="#64748B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 border-t border-[#1E2638] pt-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#3B82F6]" /> Precision
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#6366F1]" /> Recall
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#64748B]" /> mAP@50
          </span>
        </div>
      </div>

      {/* Limitations Notes */}
      <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-5">
        <h3 className="text-xs font-semibold text-white mb-2">Evaluation Scope & Context</h3>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-400 leading-relaxed">
          <li>
            These metrics reflect separate held-out test splits for the three individual models. They do not represent joint clinical validation of the combined end-to-end pipeline.
          </li>
          <li>
            Model 1 test set comprises 28 X-rays; Model 2 test set comprises 53 images.
          </li>
          <li>
            Model 3 split was performed randomly at the image level (seed 42); patient-level separation was not verified in the source dataset.
          </li>
          <li>
            Metrics must not be described as general clinical accuracy or diagnostic certainty.
          </li>
        </ul>
      </div>

      <Disclaimer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                     PAGE THREE: ARCHITECTURE & SCOPE                       */
/* -------------------------------------------------------------------------- */

function ArchitecturePage() {
  const steps = [
    {
      num: '01',
      title: 'Tooth Detection & FDI Numbering',
      model: 'YOLOv8n Object Detection',
      classes: '32 FDI permanent tooth classes (11–48)',
      description:
        'Detects individual tooth bounding boxes across the panoramic radiograph and classifies each tooth into the international two-digit FDI notation.',
    },
    {
      num: '02',
      title: 'Caries Segmentation',
      model: 'YOLOv8n-Seg Instance Segmentation',
      classes: '1 class (Caries)',
      description:
        'Generates precise polygon segmentation masks delineating carious lesions across enamel and dentin structures.',
    },
    {
      num: '03',
      title: 'Dental Findings Segmentation',
      model: 'YOLOv8n-Seg Instance Segmentation',
      classes: '5 classes (Implant, Filling, Composite, Amalgam, Crown)',
      description:
        'Segments restorative and prosthetic structures. Multiple manufacturer-specific implant labels from Dataset 3 were consolidated into a single unified Implant class.',
    },
    {
      num: '04',
      title: 'Tooth-Wise Spatial IoU Fusion',
      model: 'Geometric Overlap Heuristic',
      classes: 'Overlap Threshold ≥ 0.15',
      description:
        'Calculates intersection-over-tooth area between segmentation masks and Model 1 tooth bounding boxes. Assigns each finding exclusively to the tooth with the greatest overlap.',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2638] pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Architecture & Scope
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Technical specifications, multi-model execution flow, and methodological limitations of the PERLNEST pipeline.
        </p>
      </div>

      {/* Overview Card */}
      <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-mono text-blue-400 font-semibold mb-3">
          Deep Dental AI Research System
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
          Structured Multi-Model Radiographic Analysis
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-3xl">
          PERLNEST integrates three separately trained YOLO deep learning models into a cohesive tooth-wise analysis pipeline. Instead of presenting disconnected detections, the system computes spatial mask-to-box intersection to assign pathology and restorative findings directly to identified FDI tooth numbers.
        </p>
      </div>

      {/* Sequential Pipeline Steps */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
          Four-Stage Inference Sequence
        </h3>
        <div className="grid gap-3.5 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.num} className="rounded-xl border border-[#1E2638] bg-[#111622] p-5 flex gap-4">
              <div className="text-xl font-bold text-blue-400 font-mono shrink-0">
                {s.num}
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-semibold text-white">{s.title}</h4>
                  <span className="rounded bg-[#0A0D14] px-1.5 py-0.5 text-[9px] font-mono text-blue-400 border border-[#1E2638]">
                    {s.model}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{s.classes}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fusion Rules & Technical Constraints */}
      <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-5 space-y-4">
        <h3 className="text-xs font-semibold text-white">Spatial Fusion Specification</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-[#1E2638] bg-[#0A0D14] p-3.5">
            <div className="font-semibold text-white mb-1">Deduplication</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Duplicate Model 1 FDI tooth detections are resolved by retaining the candidate with the highest detection confidence.
            </p>
          </div>
          <div className="rounded-lg border border-[#1E2638] bg-[#0A0D14] p-3.5">
            <div className="font-semibold text-white mb-1">Best-Match Assignment</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Each segmented mask is mapped strictly to the single tooth bounding box exhibiting maximum pixel overlap (minimum 15% overlap required).
            </p>
          </div>
          <div className="rounded-lg border border-[#1E2638] bg-[#0A0D14] p-3.5">
            <div className="font-semibold text-white mb-1">Multi-Finding Support</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Distinct finding classes (e.g. an implant and a crown) may attach to the same FDI tooth, but duplicate findings of the same class are filtered.
            </p>
          </div>
        </div>
      </div>

      {/* Methodological Limitations */}
      <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-5 space-y-3">
        <h3 className="text-xs font-semibold text-white">Methodological Limitations</h3>
        <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
          <p>
            • <strong className="text-slate-200">Independent Training Distributions: </strong>
            The three models were trained on separate datasets with differing annotation protocols. Pipeline outputs are engineering associations, not unified multi-task predictions.
          </p>
          <p>
            • <strong className="text-slate-200">Heuristic Association: </strong>
            Mask-to-box overlap is a geometric association rule designed for structured reporting, not a certified clinical validation technique.
          </p>
          <p>
            • <strong className="text-slate-200">Intended Scope: </strong>
            PERLNEST is built exclusively as an academic prototype for medical AI research demonstrations and peer review.
          </p>
        </div>
      </div>

      <Disclaimer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               MAIN APP ROUTER                              */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isApiOnline, setIsApiOnline] = useState(true)

  // Polling /health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health')
        setIsApiOnline(res.ok)
      } catch {
        setIsApiOnline(false)
      }
    }

    checkHealth()
    const timer = setInterval(checkHealth, 20000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#070A12] text-slate-100 overflow-x-hidden">
      {/* 3D Animated Background */}
      <ThreeDBackground />

      {/* Sidebar Navigation */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isApiOnline={isApiOnline}
      />

      {/* Main Workspace Frame */}
      <div className="relative z-10 min-h-screen lg:pl-[240px]">
        <Topbar
          onMenu={() => setSidebarOpen(true)}
          isApiOnline={isApiOnline}
        />

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-8">
          <Routes>
            {/* Landing Page at Root */}
            <Route path="/" element={<LandingPage />} />
            {/* Interactive AI Studio Workstation */}
            <Route path="/studio" element={<AnalysisPage isApiOnline={isApiOnline} />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            {/* Backward-compatible routes */}
            <Route path="/app" element={<AnalysisPage isApiOnline={isApiOnline} />} />
            <Route path="/analysis" element={<AnalysisPage isApiOnline={isApiOnline} />} />
            <Route path="/performance" element={<BenchmarksPage />} />
            <Route path="/research" element={<ArchitecturePage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>

          {/* Clean Medical Studio Footer */}
          <footer className="mt-14 flex flex-col justify-between gap-3 border-t border-[#1E2638] py-6 text-xs text-slate-500 sm:flex-row">
            <span>© {new Date().getFullYear()} PERLNEST • Dental Deep Learning AI Research</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-blue-400" />
              <span>Educational & Research Prototype • Not for Clinical Diagnosis</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
