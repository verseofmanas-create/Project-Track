import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  IndianRupee, 
  CreditCard,
  Layers,
  Calendar,
  User,
  ArrowRight,
  Filter,
  RefreshCw,
  X,
  Briefcase,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  AlertOctagon
} from 'lucide-react'

// Formatting helper for Indian Currency (INR)
export function formatINR(num) {
  if (num === undefined || num === null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num)
}

export default function DashboardView({ projects, summary, role, onViewDetails, onRefresh }) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('All')
  const [selectedHealth, setSelectedHealth] = useState('All')
  
  // Add Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    start_date: '',
    end_date: '',
    contract_value: '',
    amount_received: '0',
    completion_percentage: 0,
    health_status: 'On Track'
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Edit Project Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editFormError, setEditFormError] = useState('')

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState(null) // project object or null
  const [deleting, setDeleting] = useState(false)

  // Unique clients list for dropdown
  const clients = ['All', ...new Set(projects.map(p => p.client))]

  // Apply filters
  const filteredProjects = projects.filter(proj => {
    const matchesSearch = proj.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          proj.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClient = selectedClient === 'All' || proj.client === selectedClient
    const matchesHealth = selectedHealth === 'All' || proj.health_status === selectedHealth
    
    return matchesSearch && matchesClient && matchesHealth
  })

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle Add Project Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    
    // Validate
    if (!formData.name.trim() || !formData.client.trim() || !formData.start_date || !formData.end_date || !formData.contract_value) {
      setFormError('Please fill in all required fields.')
      return
    }
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          contract_value: parseFloat(formData.contract_value),
          amount_received: parseFloat(formData.amount_received || 0),
          completion_percentage: parseFloat(formData.completion_percentage || 0)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
        setFormData({
          name: '',
          client: '',
          start_date: '',
          end_date: '',
          contract_value: '',
          amount_received: '0',
          completion_percentage: 0,
          health_status: 'On Track'
        })
        onRefresh()
      } else {
        setFormError(data.error || 'Failed to create project.')
      }
    } catch (e) {
      setFormError('Network error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Open Edit Modal ──
  const openEditModal = (proj) => {
    setEditFormData({
      id: proj.id,
      name: proj.name,
      client: proj.client,
      start_date: proj.start_date,
      end_date: proj.end_date,
      contract_value: proj.contract_value,
      completion_percentage: proj.completion_percentage,
      health_status: proj.health_status
    })
    setEditFormError('')
    setIsEditModalOpen(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  // ── Submit Edit ──
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditFormError('')
    if (!editFormData.name.trim() || !editFormData.client.trim()) {
      setEditFormError('Please fill in all required fields.')
      return
    }
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          client: editFormData.client,
          start_date: editFormData.start_date,
          end_date: editFormData.end_date,
          contract_value: parseFloat(editFormData.contract_value),
          completion_percentage: parseFloat(editFormData.completion_percentage),
          health_status: editFormData.health_status
        })
      })
      const data = await res.json()
      if (res.ok) {
        setIsEditModalOpen(false)
        setEditFormData(null)
        onRefresh()
      } else {
        setEditFormError(data.error || 'Failed to update project.')
      }
    } catch (err) {
      setEditFormError('Network error occurred.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Delete Project ──
  const handleDeleteProject = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteConfirm.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteConfirm(null)
        onRefresh()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Helper for Health Badges CSS
  const getHealthBadgeStyle = (status) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'At Risk':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'Delayed':
        return 'bg-rose-50 text-rose-700 border border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ── Page Header & Utilities ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">System Dashboard</h2>
          <p className="text-sm text-slate-400">Live operational status and executive summary of Dhatri construction projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {role === 'Admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-orange-600/10 focus-ring"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* ── Global Executive Summary Widgets (Admin Only) ── */}
      {role === 'Admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          
          {/* Card 1: Active Projects */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Projects</span>
              <h3 className="text-2xl font-display font-bold text-white">{summary.total_active_projects}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total Contract Value */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contract Value</span>
              <h3 className="text-base font-display font-bold text-white truncate max-w-[120px]">{formatINR(summary.total_contract_value)}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Total Outstanding Dues */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
              <h3 className="text-base font-display font-bold text-white truncate max-w-[120px]">{formatINR(summary.total_outstanding_dues)}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Active Alerts */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Alerts</span>
              <h3 className="text-2xl font-display font-bold text-rose-500">{summary.total_active_alerts}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5: Total Reports */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</span>
              <h3 className="text-2xl font-display font-bold text-emerald-400">{summary.total_reports_count || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 6: Logged Issues */}
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 border-slate-800/80 hover:border-slate-700/80 transition-all">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Logged Issues</span>
              <h3 className="text-2xl font-display font-bold text-amber-500">{summary.total_issues_count || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>

        </div>
      )}

      {/* ── Top Control Filter Strip ── */}
      <div className="glass-panel p-4 rounded-xl border-slate-800/80 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by project or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 text-sm rounded-lg text-slate-200 focus-ring placeholder-slate-500"
          />
        </div>
        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Filter className="w-3 h-3" /> Client</span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-200 focus-ring"
            >
              {clients.map(c => (
                <option key={c} value={c} className="bg-slate-950 text-slate-200">{c}</option>
              ))}
            </select>
          </div>

          {/* Health Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Health</span>
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-200 focus-ring"
            >
              <option value="All" className="bg-slate-950 text-slate-200">All Statuses</option>
              <option value="On Track" className="bg-slate-950 text-slate-200">On Track</option>
              <option value="At Risk" className="bg-slate-950 text-slate-200">At Risk</option>
              <option value="Delayed" className="bg-slate-950 text-slate-200">Delayed</option>
            </select>
          </div>

        </div>      </div>

      {/* ── Project Summary Data Grid ── */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel py-16 px-4 rounded-xl text-center border-slate-800/80">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-300">No Projects Found</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Try adjusting your search query or dropdown filter variables to find the construction record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const isOutstandingAlert = role === 'Admin' && proj.outstanding_balance > (0.3 * proj.contract_value);
            return (
              <div 
                key={proj.id}
                className="glass-panel rounded-xl border-slate-800/80 glass-panel-hover flex flex-col p-5 space-y-5"
              >
                {/* Header: Title, Health and Alert status */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base font-bold text-white font-display truncate hover:text-amber-500 transition-colors cursor-pointer" onClick={() => onViewDetails(proj.id)}>
                      {proj.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{proj.client}</span>
                    </div>
                  </div>

                  {/* Health Badge */}
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${getHealthBadgeStyle(proj.health_status)}`}>
                    {proj.health_status}
                  </span>
                </div>

                {/* Overdue Alert banner inside card (Admin Only) */}
                {isOutstandingAlert && (
                  <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Payment collection highly overdue</span>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Start Date</span>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(proj.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Expected End</span>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(proj.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Work Completion</span>
                    <span className="text-white font-bold">{proj.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="gradient-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Financial Summary Preview (Admin Only) */}
                {role === 'Admin' && (
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <div>
                      <span className="text-slate-500">Contract:</span>{' '}
                      <span className="text-slate-200 font-bold">{formatINR(proj.contract_value)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Expenses:</span>{' '}
                      <span className="text-slate-200 font-bold">{formatINR(proj.total_expenses)}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails(proj.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {role === 'Admin' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(proj); }}
                        className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(proj); }}
                        className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Project Modal Form (Admin Only) ── */}
      {isModalOpen && role === 'Admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          {/* Content container */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Initialize Project</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                
                {/* Project Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Gachibowli Commercial Build-out"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600"
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="client"
                    required
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="e.g., Aurobindo Realty"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600"
                  />
                </div>

                {/* Date Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="start_date"
                      required
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Completion <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="end_date"
                      required
                      value={formData.end_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring"
                    />
                  </div>
                </div>

                {/* Financial Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contract Value (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="contract_value"
                      required
                      value={formData.contract_value}
                      onChange={handleChange}
                      placeholder="e.g., 15000000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Received (₹)</label>
                    <input
                      type="number"
                      name="amount_received"
                      value={formData.amount_received}
                      onChange={handleChange}
                      placeholder="e.g., 10500000"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Initial Status/Progress */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Status</label>
                    <select
                      name="health_status"
                      value={formData.health_status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring"
                    >
                      <option value="On Track" className="bg-slate-900">On Track</option>
                      <option value="At Risk" className="bg-slate-900">At Risk</option>
                      <option value="Delayed" className="bg-slate-900">Delayed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion ({formData.completion_percentage}%)</label>
                    <input
                      type="range"
                      name="completion_percentage"
                      min="0"
                      max="100"
                      value={formData.completion_percentage}
                      onChange={handleChange}
                      className="w-full accent-orange-600 mt-2.5 cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-orange-600/10"
                >
                  {submitting ? 'Initializing...' : 'Initialize'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── Edit Project Modal (Admin Only) ── */}
      {isEditModalOpen && editFormData && role === 'Admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsEditModalOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Edit Project</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-medium">{editFormError}</div>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required value={editFormData.name} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" name="client" required value={editFormData.client} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
                    <input type="date" name="start_date" value={editFormData.start_date} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Completion</label>
                    <input type="date" name="end_date" value={editFormData.end_date} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contract Value (₹)</label>
                  <input type="number" name="contract_value" value={editFormData.contract_value} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Status</label>
                    <select name="health_status" value={editFormData.health_status} onChange={handleEditChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring">
                      <option value="On Track" className="bg-slate-900">On Track</option>
                      <option value="At Risk" className="bg-slate-900">At Risk</option>
                      <option value="Delayed" className="bg-slate-900">Delayed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion ({editFormData.completion_percentage}%)</label>
                    <input type="range" name="completion_percentage" min="0" max="100" value={editFormData.completion_percentage} onChange={handleEditChange} className="w-full accent-orange-600 mt-2.5 cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10">
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
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
                  <h3 className="text-base font-bold text-white">Delete Project</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                <p className="text-sm text-slate-300 font-semibold">{deleteConfirm.name}</p>
                <p className="text-xs text-slate-500 mt-1">All milestones, notes, payments, and expenses associated with this project will be permanently deleted.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/10"
                >
                  {deleting ? 'Deleting...' : 'Delete Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
