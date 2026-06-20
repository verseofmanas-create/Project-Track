import React, { useState, useEffect } from 'react'
import { AlertOctagon, Plus, Search, Filter, Trash2, Calendar, User, Eye, X, CheckCircle, Clock, Play, HelpCircle } from 'lucide-react'

export default function IssuesView({ role, projects }) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)

  // Form State
  const [formProject, setFormProject] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSeverity, setFormSeverity] = useState('Medium')
  const [formReportedBy, setFormReportedBy] = useState('')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formDateReported, setFormDateReported] = useState(new Date().toISOString().split('T')[0])
  const [formLoading, setFormLoading] = useState(false)

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/issues')
      if (!res.ok) throw new Error('Failed to load issues')
      const data = await res.json()
      setIssues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
    if (projects.length > 0) {
      setFormProject(projects[0].id)
    }
  }, [projects])

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    if (!formProject || !formTitle || !formDescription || !formReportedBy || !formAssignedTo) return

    setFormLoading(true)
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(formProject),
          title: formTitle,
          description: formDescription,
          severity: formSeverity,
          status: 'Open',
          reported_by: formReportedBy,
          assigned_to: formAssignedTo,
          date_reported: formDateReported
        })
      })

      if (!res.ok) throw new Error('Failed to report issue')

      // Reset
      setFormTitle('')
      setFormDescription('')
      setFormReportedBy('')
      setFormAssignedTo('')
      setFormSeverity('Medium')
      setIsCreateOpen(false)

      await fetchIssues()
    } catch (err) {
      alert(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const dateResolved = newStatus === 'Resolved' || newStatus === 'Closed'
        ? new Date().toISOString().split('T')[0]
        : null

      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          date_resolved: dateResolved
        })
      })

      if (!res.ok) throw new Error('Failed to update issue status')
      
      await fetchIssues()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteIssue = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return

    try {
      const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete issue')
      
      await fetchIssues()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewIssue = (issue) => {
    setSelectedIssue(issue)
    setIsViewOpen(true)
  }

  // Filter calculation
  const filteredIssues = issues.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.assigned_to.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesProject = selectedProjectId === 'all' || i.project_id === parseInt(selectedProjectId)
    const matchesSeverity = selectedSeverity === 'all' || i.severity === selectedSeverity
    const matchesStatus = selectedStatus === 'all' || i.status === selectedStatus

    return matchesSearch && matchesProject && matchesSeverity && matchesStatus
  })

  // Counters
  const totalCount = issues.length
  const openCount = issues.filter(i => i.status === 'Open').length
  const progressCount = issues.filter(i => i.status === 'In Progress').length
  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length

  const getSeverityStyles = (sev) => {
    switch (sev) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/25 font-bold'
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'Low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusStyles = (stat) => {
    switch (stat) {
      case 'Open': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Closed': return 'bg-slate-500/20 text-slate-400 border-slate-700/50'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide font-display">
            ISSUES & RISK TRACKER
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Log, assign, and track engineering deviations, material delays, quality failures, and safety hazards.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logged Issues</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-slate-800 text-slate-400 rounded-xl border border-slate-700">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New / Open</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{openCount}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Progress</p>
            <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{progressCount}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Play className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolved</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
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
            placeholder="Search title, details, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors text-slate-200 placeholder-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Project */}
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

          {/* Severity */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border-none focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Severities</option>
              <option value="Critical" className="bg-slate-950 text-slate-200">Critical</option>
              <option value="High" className="bg-slate-950 text-slate-200">High</option>
              <option value="Medium" className="bg-slate-950 text-slate-200">Medium</option>
              <option value="Low" className="bg-slate-950 text-slate-200">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border-none focus:outline-none text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-950 text-slate-200">All Statuses</option>
              <option value="Open" className="bg-slate-950 text-slate-200">Open</option>
              <option value="In Progress" className="bg-slate-950 text-slate-200">In Progress</option>
              <option value="Resolved" className="bg-slate-950 text-slate-200">Resolved</option>
              <option value="Closed" className="bg-slate-950 text-slate-200">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl h-64 flex items-center justify-center">
          <div className="text-slate-400 text-sm animate-pulse">Scanning issue logs...</div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-12 text-center text-slate-400">
          <AlertOctagon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-white">No active issues match filters</h4>
          <p className="text-xs mt-1">Excellent! No deviations currently logged under these configurations.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Deviation / Issue</th>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6 text-center">Status Status</th>
                  <th className="py-4 px-6">Assigned Agent</th>
                  <th className="py-4 px-6 font-mono">Date Reported</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredIssues.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-100">{i.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5 max-w-[240px] truncate">{i.description}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 max-w-[160px] truncate">{i.project_name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${getSeverityStyles(i.severity)}`}>
                        {i.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        {role === 'Admin' ? (
                          <select
                            value={i.status}
                            onChange={(e) => handleStatusChange(i.id, e.target.value)}
                            className={`px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs font-bold ${getStatusStyles(i.status)} cursor-pointer`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getStatusStyles(i.status)}`}>
                            {i.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{i.assigned_to}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">{i.date_reported}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewIssue(i)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {role === 'Admin' && (
                          <button
                            onClick={() => handleDeleteIssue(i.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete Issue Record"
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
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Log Construction Issue</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Project Affected</label>
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
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Severity level</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                  >
                    <option value="Critical">Critical (Immediate Block)</option>
                    <option value="High">High (Schedule Risk)</option>
                    <option value="Medium">Medium (General Concern)</option>
                    <option value="Low">Low (Minor Delay)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Issue Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaffolding Joint Damage on Slab 4"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Reported By</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={formReportedBy}
                    onChange={(e) => setFormReportedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Agent / Entity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural subcontractor"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none placeholder-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Date Reported</label>
                <input
                  type="date"
                  required
                  value={formDateReported}
                  onChange={(e) => setFormDateReported(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Description & Impact Details</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe the issue, specific locations, photos/tests referenced, and estimated delays..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  {formLoading ? 'Submitting...' : 'File Issue Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewOpen && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsViewOpen(false)} className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border border-slate-850 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyles(selectedIssue.severity)}`}>
                  {selectedIssue.severity} Severity
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getStatusStyles(selectedIssue.status)}`}>
                  {selectedIssue.status}
                </span>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-white leading-snug">{selectedIssue.title}</h2>
                <p className="text-slate-400 text-xs mt-1">Project Affected: <span className="text-slate-200">{selectedIssue.project_name}</span></p>
              </div>

              <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description & Logs</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedIssue.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 text-xs">
                <div className="space-y-2">
                  <div className="text-slate-500">Reported By</div>
                  <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>{selectedIssue.reported_by}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>Reported: {selectedIssue.date_reported}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-500">Assigned Agent</div>
                  <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>{selectedIssue.assigned_to}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>Resolved: {selectedIssue.date_resolved || 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-850 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
