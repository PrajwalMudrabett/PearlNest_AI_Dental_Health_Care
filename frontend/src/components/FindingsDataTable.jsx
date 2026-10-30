import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react'

export default function FindingsDataTable({
  rows = [],
  onExportCsv,
  isExportDisabled = false,
}) {
  const [query, setQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [sortField, setSortField] = useState('FDI')
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'

  const findingTypes = ['All', 'Caries', 'Implant', 'Filling', 'Composite filling', 'Amalgam filling', 'Crown']

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const text = Object.values(row).join(' ').toLowerCase()
      const finding = String(row.Finding ?? row.finding ?? '').trim()
      const matchesQuery = text.includes(query.toLowerCase())
      const matchesCategory =
        selectedFilter === 'All' ||
        finding.toLowerCase() === selectedFilter.toLowerCase()
      return matchesQuery && matchesCategory
    })
  }, [rows, query, selectedFilter])

  // Sort rows
  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    list.sort((a, b) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA
      }

      // FDI numeric comparison
      if (sortField === 'FDI' || sortField === 'fdi') {
        const numA = Number(valA) || 0
        const numB = Number(valB) || 0
        return sortDirection === 'asc' ? numA - numB : numB - numA
      }

      // String comparison
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filteredRows, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const columns = [
    { key: 'FDI', label: 'FDI Tooth' },
    { key: 'Tooth Confidence', label: 'Tooth Confidence' },
    { key: 'Finding', label: 'Finding Classification' },
    { key: 'Finding Confidence', label: 'Finding Confidence' },
    { key: 'Overlap', label: 'Spatial Overlap (IoU)' },
  ]

  const getFindingBadge = (findingStr) => {
    const text = String(findingStr || 'None').trim()
    const lower = text.toLowerCase()

    if (lower.includes('caries')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          {text}
        </span>
      )
    }
    if (lower.includes('implant')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          {text}
        </span>
      )
    }
    if (lower.includes('filling') || lower.includes('composite')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {text}
        </span>
      )
    }
    if (lower.includes('crown')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {text}
        </span>
      )
    }
    if (lower.includes('amalgam')) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-slate-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {text}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#161D2D] px-2.5 py-0.5 text-xs font-medium text-slate-400 border border-[#1E2638]">
        None / Healthy
      </span>
    )
  }

  return (
    <div className="rounded-xl border border-[#1E2638] bg-[#111622] overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2638] bg-[#0E131F] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161D2D] text-blue-400 border border-[#1E2638]">
            <FileSpreadsheet size={15} />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white">Tooth-Wise Findings Ledger</h3>
            <p className="text-[11px] text-slate-400">
              {rows.length} total tooth assignments linked via mask-to-bounding-box overlap.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isExportDisabled || rows.length === 0}
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2638] bg-[#161D2D] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-40"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 border-b border-[#1E2638] p-4 sm:flex-row bg-[#0A0D14]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by FDI number, finding classification, or confidence…"
            className="w-full rounded-lg border border-[#1E2638] bg-[#111622] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Category:</span>
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="appearance-none rounded-lg border border-[#1E2638] bg-[#111622] py-2 pl-3 pr-8 text-xs text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
            >
              {findingTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Findings' : t}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="scrollbar-thin overflow-x-auto max-h-[460px]">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-[#0E131F] z-10 border-b border-[#1E2638]">
            <tr>
              {columns.map(({ key, label }) => {
                const isActive = sortField === key
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="cursor-pointer whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-400 hover:text-white transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{label}</span>
                      {isActive ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp size={12} className="text-blue-400" />
                        ) : (
                          <ArrowDown size={12} className="text-blue-400" />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-600" />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => {
              const fdi = row.FDI ?? row.fdi ?? '—'
              const toothConf = row['Tooth Confidence'] ?? row.tooth_confidence
              const finding = row.Finding ?? row.finding ?? 'None'
              const findingConf = row['Finding Confidence'] ?? row.finding_confidence
              const overlap = row.Overlap ?? row.overlap

              return (
                <tr
                  key={i}
                  className="border-t border-[#1E2638]/70 transition hover:bg-[#161D2D]/50"
                >
                  {/* FDI */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-white">
                    <span className="inline-flex items-center justify-center h-6 w-7 rounded bg-[#161D2D] border border-[#1E2638] text-blue-400">
                      {fdi}
                    </span>
                  </td>

                  {/* Tooth Confidence */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                    {typeof toothConf === 'number' ? (
                      <div className="flex items-center gap-2">
                        <span>{toothConf.toFixed(3)}</span>
                        <div className="w-12 h-1 rounded-full bg-[#161D2D] overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${Math.min(100, toothConf * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Finding */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {getFindingBadge(finding)}
                  </td>

                  {/* Finding Confidence */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                    {typeof findingConf === 'number' && findingConf > 0
                      ? findingConf.toFixed(3)
                      : '—'}
                  </td>

                  {/* Overlap */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                    {typeof overlap === 'number' && overlap > 0 ? (
                      <span className="text-white font-medium">{overlap.toFixed(3)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sortedRows.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            <div className="text-sm font-medium text-slate-300 mb-1">
              {rows.length === 0
                ? 'No tooth findings to display'
                : 'No results match the current query'}
            </div>
            <p className="text-xs">
              {rows.length === 0
                ? 'Submit an X-ray to generate tooth-wise segmentation assignments.'
                : 'Try adjusting the search query or category filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between border-t border-[#1E2638] bg-[#0E131F] px-4 py-2 text-[11px] text-slate-400">
        <span>Showing {sortedRows.length} of {rows.length} rows</span>
        <span className="font-mono text-[10px] text-slate-500">Model outputs are experimental; not clinical probabilities.</span>
      </div>
    </div>
  )
}
