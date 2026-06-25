import React, { useState, useEffect } from 'react'
import { FileText, Plus, Search, Filter, Trash2, Calendar, User, Eye, X, BookOpen, AlertCircle, AlertTriangle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

export default function ReportsView({ role, projects }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState(null) // report object or null
  const [deleting, setDeleting] = useState(false)

  // Form State
  const [formProject, setFormProject] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('Progress')
  const [formContent, setFormContent] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formStatus, setFormStatus] = useState('Published')
  const [formLoading, setFormLoading] = useState(false)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reports')
      if (!res.ok) throw new Error('Failed to load reports')
      const data = await res.json()
      setReports(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    if (projects.length > 0) {
      setFormProject(projects[0].id)
    }
  }, [projects])

  const handleCreateReport = async (e) => {
    e.preventDefault()
    if (!formProject || !formTitle || !formContent || !formAuthor) return

    setFormLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(formProject),
          title: formTitle,
          type: formType,
          content: formContent,
          generated_by: formAuthor,
          date: formDate,
          status: formStatus
        })
      })

      if (!res.ok) throw new Error('Failed to create report')
      
      // Reset Form & Close Modal
      setFormTitle('')
      setFormContent('')
      setFormAuthor('')
      setFormStatus('Published')
      setIsCreateOpen(false)
      
      // Refresh list
      await fetchReports()
    } catch (err) {
      alert(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteReport = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/reports/${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete report')
      
      setDeleteConfirm(null)
      // Refresh list
      await fetchReports()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleViewReport = (report) => {
    setSelectedReport(report)
    setIsViewOpen(true)
  }

  const handleExportPDF = (report) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Colors
    const primaryColor = [15, 23, 42]   // slate-900
    const accentColor = [234, 88, 12]   // orange-600
    const mutedColor = [100, 116, 139]  // slate-500
    const lightBg = [248, 250, 252]    // slate-50

    // Color helpers to avoid spread operator argument mapping issues in transpiled ESM code
    const setFill = (pdf, color) => pdf.setFillColor(color[0], color[1], color[2])
    const setText = (pdf, color) => pdf.setTextColor(color[0], color[1], color[2])
    const setDraw = (pdf, color) => pdf.setDrawColor(color[0], color[1], color[2])

    const drawHeader = (pdfPage) => {
      // Top border banner
      setFill(pdfPage, accentColor)
      pdfPage.rect(0, 0, 210, 8, 'F')

      // Company logo & Name
      pdfPage.setFont('Helvetica', 'bold')
      pdfPage.setFontSize(16)
      setText(pdfPage, primaryColor)
      pdfPage.text('DHATRI CONSTRUCTIONS', 20, 22)

      pdfPage.setFont('Helvetica', 'normal')
      pdfPage.setFontSize(8)
      setText(pdfPage, mutedColor)
      pdfPage.text('ENTERPRISE PROJECT MANAGEMENT PORTAL', 20, 26)

      // Document type identifier
      pdfPage.setFont('Helvetica', 'bold')
      pdfPage.setFontSize(10)
      setText(pdfPage, accentColor)
      pdfPage.text('OFFICIAL PROJECT REPORT', 140, 22)
      
      // Date
      pdfPage.setFont('Helvetica', 'normal')
      pdfPage.setFontSize(8)
      setText(pdfPage, mutedColor)
      pdfPage.text(`EXPORTED: ${new Date().toLocaleDateString()}`, 140, 26)

      // Line separator
      pdfPage.setDrawColor(226, 232, 240) // slate-200
      pdfPage.setLineWidth(0.5)
      pdfPage.line(20, 30, 190, 30)
    }

    const drawFooter = (pdfPage, pageNum, totalPages) => {
      // Footer line
      pdfPage.setDrawColor(226, 232, 240)
      pdfPage.setLineWidth(0.5)
      pdfPage.line(20, 280, 190, 280)

      pdfPage.setFont('Helvetica', 'normal')
      pdfPage.setFontSize(8)
      setText(pdfPage, mutedColor)
      pdfPage.text('Confidential - For Internal Use Only', 20, 286)
      pdfPage.text(`Page ${pageNum} of ${totalPages}`, 170, 286)
    }

    // First page setup
    drawHeader(doc)

    // ── METADATA GRID BOX ──
    setFill(doc, lightBg)
    doc.rect(20, 36, 170, 48, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(20, 36, 170, 48, 'S')

    // Metadata labels & values
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(9)
    setText(doc, mutedColor)
    doc.text('REPORT TITLE:', 25, 43)
    doc.text('PROJECT:', 25, 51)
    doc.text('REPORT TYPE:', 25, 59)
    doc.text('GENERATED BY:', 25, 67)
    doc.text('DATE:', 25, 75)

    doc.setFont('Helvetica', 'normal')
    setText(doc, primaryColor)
    doc.setFontSize(10)
    
    // Bold title
    doc.setFont('Helvetica', 'bold')
    doc.text(report.title || 'Untitled Report', 55, 43)
    doc.setFont('Helvetica', 'normal')
    doc.text(report.project_name || 'N/A', 55, 51)
    doc.text(report.type || 'Progress', 55, 59)
    doc.text(report.generated_by || 'Unknown', 55, 67)
    doc.setFont('Helvetica', 'bold')
    doc.text(report.date || new Date().toLocaleDateString(), 55, 75)

    // Status Badge in Metadata Box
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(9)
    setText(doc, mutedColor)
    doc.text('STATUS:', 130, 43)
    
    if (report.status === 'Published') {
      doc.setFillColor(209, 250, 229) // green-100
      doc.rect(130, 46, 25, 6, 'F')
      doc.setFontSize(8)
      doc.setTextColor(6, 95, 70) // green-800
      doc.text('PUBLISHED', 133, 50)
    } else {
      doc.setFillColor(254, 243, 199) // amber-100
      doc.rect(130, 46, 20, 6, 'F')
      doc.setFontSize(8)
      doc.setTextColor(146, 64, 14) // amber-800
      doc.text('DRAFT', 134, 50)
    }

    // ── EXECUTIVE SUMMARY / CONTENT ──
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    setText(doc, primaryColor)
    doc.text('REPORT CONTENT & EXECUTIVE SUMMARY', 20, 94)

    // Underline for section title
    setDraw(doc, accentColor)
    doc.setLineWidth(0.8)
    doc.line(20, 96, 60, 96)

    // Content body
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85) // slate-700
    
    const contentText = report.content || 'No content provided.'
    const textLines = doc.splitTextToSize(contentText, 170)
    let y = 104
    const pageHeightLimit = 265

    for (let i = 0; i < textLines.length; i++) {
      if (y > pageHeightLimit) {
        doc.addPage()
        // Setup subsequent pages
        drawHeader(doc)
        y = 40 // Start lower since there's no metadata box on page 2+
      }
      doc.text(textLines[i], 20, y)
      y += 6.5 // Line height
    }

    // Add footers with correct total page count
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      drawFooter(doc, i, totalPages)
    }

    // Save the PDF
    const filename = `${(report.title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.pdf`
    doc.save(filename)
  }

  // Filtered reports calculation
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.generated_by.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesProject = selectedProjectId === 'all' || r.project_id === parseInt(selectedProjectId)
    const matchesType = selectedType === 'all' || r.type === selectedType
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus

    return matchesSearch && matchesProject && matchesType && matchesStatus
  })

  // Summary Metrics
  const totalReports = reports.length
  const publishedReports = reports.filter(r => r.status === 'Published').length
  const draftReports = reports.filter(r => r.status === 'Draft').length

  const getReportTypeStyles = (type) => {
    switch (type) {
      case 'Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Financial': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Safety': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'Compliance': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-display">
            PROJECT REPORTS & AUDITS
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Generate, publish, and inspect project progress reviews, financial statements, safety audits, and regulatory filings.
          </p>
        </div>
        {role === 'Admin' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Generated Reports</p>
            <h3 className="text-2xl font-extrabold text-white mt-1.5">{totalReports}</h3>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <FileText className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Published Documents</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1.5">{publishedReports}</h3>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Draft Outlines</p>
            <h3 className="text-2xl font-extrabold text-amber-500 mt-1.5">{draftReports}</h3>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center justify-between shadow-inner">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports title, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors text-slate-200 placeholder-slate-600"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Project filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-950 border-none focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">{p.name}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border-none focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Types</option>
              <option value="Progress" className="bg-slate-950 text-slate-200">Progress</option>
              <option value="Financial" className="bg-slate-950 text-slate-200">Financial</option>
              <option value="Safety" className="bg-slate-950 text-slate-200">Safety</option>
              <option value="Compliance" className="bg-slate-950 text-slate-200">Compliance</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border-none focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Statuses</option>
              <option value="Published" className="bg-slate-950 text-slate-200">Published</option>
              <option value="Draft" className="bg-slate-950 text-slate-200">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table/Grid */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl h-64 flex items-center justify-center">
          <div className="text-slate-400 text-sm animate-pulse">Retrieving compliance logs...</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-white">No reports match filter criteria</h4>
          <p className="text-xs mt-1">Try resetting filters or generate a new document record.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Report Title</th>
                  <th className="py-4 px-6">Project Workspace</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-100">{r.title}</td>
                    <td className="py-4 px-6 text-slate-300 max-w-[200px] truncate">{r.project_name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getReportTypeStyles(r.type)}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{r.generated_by}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{r.date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        r.status === 'Published' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewReport(r)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(r)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {role === 'Admin' && (
                          <button
                            onClick={() => setDeleteConfirm(r)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCreateOpen(false)} className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border border-slate-850 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Generate Project Report</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Select Project</label>
                  <select
                    required
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Report Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                  >
                    <option value="Progress">Progress</option>
                    <option value="Financial">Financial</option>
                    <option value="Safety">Safety</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q2 Quality Control Review"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Author (Generated By)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Reddy"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Report Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Publish Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Content / Executive Summary</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Enter main content of the report..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {formLoading ? 'Generating...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsViewOpen(false)} className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border border-slate-850 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/60">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedReport.status === 'Published' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {selectedReport.status}
                </span>
                <span className="ml-2 text-slate-500 text-xs font-mono">{selectedReport.date}</span>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 space-y-6">
              <div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getReportTypeStyles(selectedReport.type)}`}>
                  {selectedReport.type}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-3 leading-snug">{selectedReport.title}</h2>
                <p className="text-slate-400 text-xs mt-1">Project: <span className="text-slate-200">{selectedReport.project_name}</span></p>
              </div>

              <div className="border-t border-b border-slate-800/80 py-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {selectedReport.content}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Author: <strong className="text-slate-400">{selectedReport.generated_by}</strong></span>
                </div>
                <span>Document ID: #{selectedReport.id}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-850 bg-slate-900/40 flex justify-end gap-3">
              <button
                onClick={() => handleExportPDF(selectedReport)}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Report</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                <p className="text-sm text-slate-300 font-semibold">{deleteConfirm.title}</p>
                <p className="text-xs text-slate-500 mt-1">Project: {deleteConfirm.project_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Author: {deleteConfirm.generated_by} | Date: {deleteConfirm.date}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReport}
                  disabled={deleting}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/10"
                >
                  {deleting ? 'Deleting...' : 'Delete Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
