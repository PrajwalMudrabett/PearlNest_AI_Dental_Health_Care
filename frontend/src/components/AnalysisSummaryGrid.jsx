import React from 'react'
import {
  ScanLine,
  Activity,
  Zap,
  FlaskConical,
  Sparkles,
  Microscope,
  BadgeCheck
} from 'lucide-react'

export default function AnalysisSummaryGrid({ summary = {}, hasResult = false }) {
  const metrics = [
    {
      id: 'teeth',
      label: 'Unique Teeth Detected',
      value: summary.teeth_detected ?? 0,
      description: 'FDI tooth boxes',
      icon: ScanLine,
      color: 'blue',
      badge: 'Model 1',
    },
    {
      id: 'caries',
      label: 'Caries Assignments',
      value: summary.caries_assignments ?? 0,
      description: 'Caries masks',
      icon: Activity,
      color: 'rose',
      badge: 'Model 2',
    },
    {
      id: 'implants',
      label: 'Implant Assignments',
      value: summary.implant_assignments ?? 0,
      description: 'Titanium implants',
      icon: Zap,
      color: 'indigo',
      badge: 'Model 3',
    },
    {
      id: 'fillings',
      label: 'Filling Assignments',
      value: summary.filling_assignments ?? 0,
      description: 'Standard restorations',
      icon: FlaskConical,
      color: 'amber',
      badge: 'Model 3',
    },
    {
      id: 'composite',
      label: 'Composite Fillings',
      value: summary.composite_assignments ?? 0,
      description: 'Resin composite',
      icon: Sparkles,
      color: 'amber',
      badge: 'Model 3',
    },
    {
      id: 'amalgam',
      label: 'Amalgam Fillings',
      value: summary.amalgam_assignments ?? 0,
      description: 'Metallic amalgam',
      icon: Microscope,
      color: 'slate',
      badge: 'Model 3',
    },
    {
      id: 'crowns',
      label: 'Crown Assignments',
      value: summary.crown_assignments ?? 0,
      description: 'Prosthetic crowns',
      icon: BadgeCheck,
      color: 'purple',
      badge: 'Model 3',
    },
  ]

  const getColorClasses = (color) => {
    switch (color) {
      case 'rose':
        return {
          icon: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        }
      case 'indigo':
        return {
          icon: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        }
      case 'amber':
        return {
          icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        }
      case 'purple':
        return {
          icon: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        }
      case 'slate':
        return {
          icon: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
        }
      default:
        return {
          icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        }
    }
  }

  return (
    <div className="rounded-xl border border-[#1E2638] bg-[#111622] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-[#1E2638] pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            Fused Tooth-Wise Findings Summary
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Model-generated findings associated with FDI teeth via spatial bounding-box overlap (threshold ≥ 0.15).
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-[#0A0D14] px-2.5 py-1 rounded-md border border-[#1E2638]">
          {hasResult ? 'Pipeline Processed' : 'Awaiting Inference'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {metrics.map((m) => {
          const { icon } = getColorClasses(m.color)
          const Icon = m.icon

          return (
            <div
              key={m.id}
              className="rounded-xl border border-[#1E2638] bg-[#0A0D14] p-3 transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] font-medium text-slate-300 truncate">
                  {m.label}
                </span>
                <span className={`p-1.5 rounded-lg border ${icon} shrink-0`}>
                  <Icon size={13} />
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                {hasResult ? m.value : '—'}
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>{m.description}</span>
                <span className="font-mono text-[9px] text-slate-500">{m.badge}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
