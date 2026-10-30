import React from 'react'

export default function FdiGridMap({ rows = [], onSelectFdi, selectedFdi }) {
  // Map rows by FDI
  const findingsByFdi = new Map()
  rows.forEach((r) => {
    const fdi = Number(r.FDI ?? r.fdi)
    if (fdi) {
      findingsByFdi.set(fdi, {
        fdi,
        finding: String(r.Finding ?? r.finding ?? 'None'),
        confidence: Number(r['Tooth Confidence'] ?? r.tooth_confidence ?? 0),
        overlap: Number(r.Overlap ?? r.overlap ?? 0),
      })
    }
  })

  // Quadrants
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11] // Upper Right
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28] // Upper Left
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41] // Lower Right
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38] // Lower Left

  const renderToothCell = (fdi) => {
    const data = findingsByFdi.get(fdi)
    const isDetected = !!data
    const isSelected = selectedFdi === fdi
    const finding = (data?.finding || '').toLowerCase()

    let badgeColor = 'bg-[#152330] border-line text-slate-400'
    let statusDot = null

    if (isDetected) {
      if (finding.includes('caries')) {
        badgeColor = 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
        statusDot = <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
      } else if (finding.includes('implant')) {
        badgeColor = 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
        statusDot = <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      } else if (finding.includes('filling') || finding.includes('composite')) {
        badgeColor = 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
        statusDot = <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      } else if (finding.includes('crown')) {
        badgeColor = 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
        statusDot = <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
      } else {
        badgeColor = 'bg-mint/15 border-mint/40 text-mint shadow-[0_0_10px_rgba(114,227,208,0.2)]'
        statusDot = <span className="h-1.5 w-1.5 rounded-full bg-mint" />
      }
    }

    return (
      <button
        key={fdi}
        onClick={() => onSelectFdi && onSelectFdi(fdi)}
        className={`group relative flex flex-col items-center justify-center rounded-lg border p-1.5 text-center transition-all ${badgeColor} ${
          isSelected ? 'ring-2 ring-mint ring-offset-2 ring-offset-[#0b121b] scale-105 z-10' : 'hover:scale-105'
        }`}
        title={`FDI ${fdi}: ${isDetected ? data.finding : 'Undetected'}`}
      >
        <span className="font-mono text-xs font-bold">{fdi}</span>
        <div className="mt-1 flex items-center gap-1">
          {statusDot}
          {isDetected && (
            <span className="text-[8px] font-medium uppercase tracking-tight truncate max-w-[36px]">
              {data.finding !== 'None' ? data.finding.slice(0, 4) : 'OK'}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-panel/80 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-line/70 pb-3">
        <div>
          <h4 className="display-font text-sm font-semibold text-slate-100">
            FDI Dental Chart Matrix
          </h4>
          <p className="text-[10px] text-muted">
            32-Tooth permanent dentition quadrants with synchronized pipeline findings
          </p>
        </div>
        <span className="rounded-full border border-line bg-[#0c1520] px-2.5 py-1 text-[10px] text-slate-300 font-mono">
          {findingsByFdi.size} / 32 Detected
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Upper Arch (Maxilla) */}
        <div>
          <div className="mb-1.5 flex justify-between text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            <span>Maxilla Right (Q1)</span>
            <span className="text-mint">Upper Jaw</span>
            <span>Maxilla Left (Q2)</span>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
            {q1.map(renderToothCell)}
            {q2.map(renderToothCell)}
          </div>
        </div>

        {/* Midline separator */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-line" />
          </div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-widest text-slate-500">
            <span className="bg-[#101923] px-3">Occlusal Plane</span>
          </div>
        </div>

        {/* Lower Arch (Mandible) */}
        <div>
          <div className="mb-1.5 flex justify-between text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            <span>Mandible Right (Q4)</span>
            <span className="text-mint">Lower Jaw</span>
            <span>Mandible Left (Q3)</span>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
            {q4.map(renderToothCell)}
            {q3.map(renderToothCell)}
          </div>
        </div>
      </div>
    </div>
  )
}
