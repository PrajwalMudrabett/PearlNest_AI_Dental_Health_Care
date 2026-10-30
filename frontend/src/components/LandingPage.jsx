import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ScanLine,
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart3,
  BookOpen,
  Image as ImageIcon,
  FileSpreadsheet,
  Stethoscope,
  ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 text-center">
        {/* Soft, calm radial backdrop - non-neon, elegant dark lighting */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Status Pill with 3D Logo */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm shadow-sm">
          <img src="/logo.png" alt="PERLNEST" className="h-4 w-4 rounded-full object-cover ring-1 ring-blue-400/40" />
          <span>Multi-Model Panoramic Dental Radiography AI</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
          Deep Learning Intelligence for{' '}
          <span className="bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
            Dental Radiography
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          PERLNEST unifies three independently trained neural networks to detect individual teeth, segment carious lesions, classify restorations, and map findings tooth-by-tooth using geometric IoU association.
        </p>

        {/* Action Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <span>Launch AI Studio</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/benchmarks"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1E2638] bg-[#111622] px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-[#161D2D] hover:border-slate-700 hover:text-white"
          >
            <BarChart3 size={16} className="text-blue-400" />
            <span>Model Benchmarks</span>
          </Link>

          <Link
            to="/architecture"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1E2638] bg-[#111622] px-5 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-[#161D2D] hover:border-slate-700 hover:text-white"
          >
            <BookOpen size={16} />
            <span>Architecture & Scope</span>
          </Link>
        </div>

        {/* Performance Metrics Cards */}
        <div className="mt-14 grid grid-cols-2 gap-3.5 sm:grid-cols-4 max-w-4xl mx-auto text-left">
          <div className="rounded-xl border border-[#1E2638] bg-[#111622]/90 p-4">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">32</div>
            <div className="mt-1 text-xs font-medium text-slate-200">FDI Tooth Classes</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Universal quadrant classification</p>
          </div>

          <div className="rounded-xl border border-[#1E2638] bg-[#111622]/90 p-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">3</div>
            <div className="mt-1 text-xs font-medium text-slate-200">YOLO Neural Models</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Parallel detection & segmentation</p>
          </div>

          <div className="rounded-xl border border-[#1E2638] bg-[#111622]/90 p-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">98.1%</div>
            <div className="mt-1 text-xs font-medium text-slate-200">Caries Precision</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Rigorous test validation split</p>
          </div>

          <div className="rounded-xl border border-[#1E2638] bg-[#111622]/90 p-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-300 font-mono">≥ 0.15</div>
            <div className="mt-1 text-xs font-medium text-slate-200">Spatial IoU Fusion</div>
            <p className="mt-0.5 text-[11px] text-slate-500">Tooth-to-finding association</p>
          </div>
        </div>
      </section>

      {/* Interactive Visual Preview / Showcase Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="overflow-hidden rounded-2xl border border-[#1E2638] bg-[#0E131F]">
          <div className="flex items-center justify-between border-b border-[#1E2638] px-5 py-3.5 bg-[#0A0D14]/80">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="ml-2 font-mono text-xs text-slate-400">PERLNEST Workstation Console</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">PACS Radiography Preview</span>
          </div>

          <div className="p-6 sm:p-8 grid gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                Triple-Model Synergistic Pipeline
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Simultaneous Detection, Segmentation & Clinical Association
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Rather than treating dental panoramic radiographs as a single detection task, PERLNEST runs specialized architectures in parallel: tooth boundary identification, high-resolution caries mask contouring, and restoration segmentation.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg border border-[#1E2638] bg-[#111622] px-3 py-1 text-slate-300">
                  Orthopantomogram (OPG)
                </span>
                <span className="rounded-lg border border-[#1E2638] bg-[#111622] px-3 py-1 text-slate-300">
                  Split-Wipe Viewer
                </span>
                <span className="rounded-lg border border-[#1E2638] bg-[#111622] px-3 py-1 text-slate-300">
                  CSV Clinical Export
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-[#1E2638] bg-[#0A0D14] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1E2638]">
                <span className="text-slate-400">Sample Execution</span>
                <span className="font-mono text-emerald-400">100% Inferred</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Teeth Identified</span>
                  <span className="font-mono text-white font-medium">28 Units</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Caries Lesions</span>
                  <span className="font-mono text-rose-400 font-medium">3 Detected</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Restorations & Fillings</span>
                  <span className="font-mono text-blue-400 font-medium">4 Classified</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Inference Duration</span>
                  <span className="font-mono text-slate-300 font-medium">~720 ms</span>
                </div>
              </div>
              <Link
                to="/studio"
                className="mt-2 block w-full rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 py-2 text-center text-xs font-semibold text-blue-300 transition"
              >
                Open Studio with Demo Image &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Core Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tracking-tight">
            Comprehensive Dental Imaging Suite
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            A structured workflow combining object detection, polygonal mask generation, and spatial IoU fusion.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
                <ScanLine size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">FDI Tooth Detection</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Model 1 isolates each individual tooth across the maxillary and mandibular arches, assigning standard FDI notations (quadrants 11 through 48).
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-blue-400 font-mono">
              YOLOv8n • 32 FDI Classes
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
                <Activity size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Caries Instance Segmentation</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Model 2 delineates carious demineralization, generating contour segmentation masks across coronal and radicular dental structures.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-rose-400 font-mono">
              YOLOv8n-Seg • 98.1% Precision
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Restorative Findings</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Model 3 identifies and segments existing dental interventions, including implants, composite and amalgam fillings, and prosthetic crowns.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-indigo-400 font-mono">
              YOLOv8n-Seg • 5 Clinical Classes
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Tooth-Wise IoU Association</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Eliminates candidate tooth duplicates and maps findings directly to individual FDI teeth based on maximum spatial intersection (≥ 0.15 threshold).
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-slate-400 font-mono">
              Geometric IoU Association
            </div>
          </div>

          {/* Card 5 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
                <ImageIcon size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Split-Wipe PACS Console</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Inspect raw vs. annotated radiographs with a draggable comparison divider, pan-and-zoom inspection (1x–3x), side-by-side mode, and fullscreen lightbox.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-emerald-400 font-mono">
              Interactive Diagnostic Console
            </div>
          </div>

          {/* Card 6 */}
          <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-6 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Structured Findings Ledger</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Searchable, sortable, and category-filtered clinical ledger displaying tooth numbers, confidence values, and overlap ratios with 1-click CSV export.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#1E2638] text-[11px] text-amber-400 font-mono">
              CSV & High-Res PNG Exports
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Sequence */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl border border-[#1E2638] bg-[#0E131F] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Analysis Workflow</span>
              <h3 className="text-xl font-bold text-white mt-1">From Raw Radiograph to Clinical Ledger</h3>
            </div>
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shrink-0"
            >
              <span>Try in Studio</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-4 text-xs">
            <div className="space-y-1.5">
              <div className="font-mono font-semibold text-blue-400 text-xs">01 Ingest</div>
              <div className="font-medium text-white">Upload OPG</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Provide any panoramic radiograph in JPG or PNG format.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono font-semibold text-blue-400 text-xs">02 Calibrate</div>
              <div className="font-medium text-white">Confidence Sliders</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Set tooth, caries, and finding detection thresholds.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono font-semibold text-blue-400 text-xs">03 Associate</div>
              <div className="font-medium text-white">Spatial Fusion</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                IoU overlap logic maps findings directly to detected FDI tooth boxes.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono font-semibold text-blue-400 text-xs">04 Export</div>
              <div className="font-medium text-white">Inspect & Export</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Examine split-wipe viewer and download clinical ledger CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Disclaimer Box */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl border border-slate-800 bg-[#111622] p-4 text-xs text-slate-400 flex items-start gap-3">
          <ShieldCheck size={18} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200 font-medium">Educational & Research Prototype:</strong> PERLNEST is developed as an academic deep learning demonstration for dental radiograph segmentation and multi-model spatial fusion. It is not a certified diagnostic device.
          </div>
        </div>
      </section>
    </div>
  )
}
