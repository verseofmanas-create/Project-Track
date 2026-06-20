import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  User, 
  CheckSquare, 
  Square, 
  Send, 
  AlertTriangle, 
  TrendingUp, 
  IndianRupee, 
  CreditCard,
  PlusCircle, 
  PieChart as PieIcon, 
  Coins,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  Trash2,
  Plus,
  Briefcase,
  Receipt
} from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'chart.js'
import { formatINR } from './DashboardView'

ChartJS.register(ArcElement, ChartTooltip, ChartLegend)

// Recharts colors for Pie Chart
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#64748b']

export default function ProjectWorkspaceView({ projectId, role, projects, onChangeProject, onRefresh }) {
  const [activeTab, setActiveTab] = useState('timeline') // 'timeline', 'revenue', 'expense'
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Tab A states
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [newMilestoneName, setNewMilestoneName] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  
  // Tab C states
  const [expenseForm, setExpenseForm] = useState({
    category: 'Labour',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [savingExpense, setSavingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState('')

  // Add Payment Modal/Form State (Admin Utility)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'Online',
    reference_id: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  // Fetch project details
  const fetchProjectDetails = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const token = localStorage.getItem('projecttrack_token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/projects/${projectId}?role=${encodeURIComponent(role)}`, {
        headers
      })
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      }
    } catch (e) {
      console.error("Failed to fetch project detail:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectDetails()
  }, [projectId, role])

  // Reset tab based on role permissions
  useEffect(() => {
    if (role === 'Site Manager' && (activeTab === 'revenue' || activeTab === 'expense')) {
      setActiveTab('timeline')
    } else if (role === 'Client' && activeTab === 'expense') {
      setActiveTab('timeline')
    }
  }, [role, activeTab])

  if (!projectId) {
    return (
      <div className="glass-panel py-16 px-4 rounded-xl text-center border-slate-800/80">
        <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-slate-300">No Project Selected</h4>
        <p className="text-sm text-slate-500 mt-1">Please select an active project from the dashboard to open the workspace deep-dive.</p>
      </div>
    )
  }

  if (loading || !project) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
        <div className="h-96 bg-slate-900/40 border border-slate-800/60 rounded-xl" />
      </div>
    )
  }

  // ── Tab A Actions ──

  // Toggle milestone checkbox
  const handleToggleMilestone = async (milestoneId) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}/toggle`, {
        method: 'POST'
      })
      if (res.ok) {
        // Toggle locally
        setProject(prev => {
          const updatedMilestones = prev.milestones.map(m => {
            if (m.id === milestoneId) {
              return { ...m, completed: m.completed === 0 ? 1 : 0 }
            }
            return m
          })
          return { ...prev, milestones: updatedMilestones }
        })
      }
    } catch (e) {
      console.error("Error toggling milestone:", e)
    }
  }

  // Range slider completion % change handler
  const handleProgressSliderChange = async (e) => {
    const newVal = parseFloat(e.target.value)
    
    // Automatically determine health status based on progress vs completion metrics
    let health = project.health_status
    if (newVal < 30 && health === 'On Track') {
      health = 'At Risk'
    } else if (newVal >= 80 && health === 'At Risk') {
      health = 'On Track'
    }

    // Update locally immediately for fluid UI
    setProject(prev => ({ 
      ...prev, 
      completion_percentage: newVal, 
      health_status: health 
    }))

    // Debounce/Send request to update database
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_percentage: newVal,
          health_status: health
        })
      })
      onRefresh() // Refresh root lists
    } catch (e) {
      console.error("Error updating project completion:", e)
    }
  }

  // Manual Health Badge Toggle (so manager can rewrite it instantly)
  const handleHealthBadgeToggle = async (status) => {
    setProject(prev => ({ ...prev, health_status: status }))
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ health_status: status })
      })
      onRefresh()
    } catch (e) {
      console.error("Error updating project health:", e)
    }
  }

  // Append a Note
  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    
    setSavingNote(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newNote,
          author: role === 'Admin' ? 'Admin Manager' : 'Site Supervisor'
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setProject(prev => ({
          ...prev,
          notes: [
            {
              id: Date.now(),
              project_id: project.id,
              text: newNote,
              timestamp: data.timestamp,
              author: role === 'Admin' ? 'Admin Manager' : 'Site Supervisor'
            },
            ...prev.notes
          ]
        }))
        setNewNote('')
      }
    } catch (e) {
      console.error("Error adding note:", e)
    } finally {
      setSavingNote(false)
    }
  }

  // Delete a Note
  const handleDeleteNote = async (noteId) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/notes/${noteId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setProject(prev => ({
          ...prev,
          notes: prev.notes.filter(n => n.id !== noteId)
        }))
      }
    } catch (err) {
      console.error("Error deleting note:", err)
    }
  }

  // Add a Milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!newMilestoneName.trim() || !newMilestoneDate) return
    setAddingMilestone(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMilestoneName,
          due_date: newMilestoneDate
        })
      })
      if (res.ok) {
        setNewMilestoneName('')
        setNewMilestoneDate('')
        fetchProjectDetails()
      }
    } catch (err) {
      console.error("Error adding milestone:", err)
    } finally {
      setAddingMilestone(false)
    }
  }

  // Delete a Milestone
  const handleDeleteMilestone = async (e, milestoneId) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchProjectDetails()
      }
    } catch (err) {
      console.error("Error deleting milestone:", err)
    }
  }

  // Delete an Expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchProjectDetails()
        onRefresh()
      }
    } catch (err) {
      console.error("Error deleting expense:", err)
    }
  }

  // ── Tab B Actions (Admin Only) ──

  // Add Payment Submit
  const handleAddPayment = async (e) => {
    e.preventDefault()
    setPaymentError('')
    if (!paymentForm.amount || !paymentForm.reference_id) {
      setPaymentError('All fields are required.')
      return
    }

    setSavingPayment(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_mode: paymentForm.payment_mode,
          reference_id: paymentForm.reference_id,
          date: paymentForm.date
        })
      })

      if (res.ok) {
        setShowPaymentForm(false)
        setPaymentForm({
          amount: '',
          payment_mode: 'Online',
          reference_id: '',
          date: new Date().toISOString().split('T')[0]
        })
        // Reload project details to show updated balance
        fetchProjectDetails()
        onRefresh()
      } else {
        const data = await res.json()
        setPaymentError(data.error || 'Failed to submit payment.')
      }
    } catch (err) {
      setPaymentError('Network failure.')
    } finally {
      setSavingPayment(false)
    }
  }

  // ── Tab C Actions (Admin Only) ──

  // Add Expense Submit
  const handleAddExpense = async (e) => {
    e.preventDefault()
    setExpenseError('')
    if (!expenseForm.amount || !expenseForm.description.trim()) {
      setExpenseError('Please fill in amount and description.')
      return
    }

    setSavingExpense(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          date: expenseForm.date,
          description: formDataShorten(expenseForm.description)
        })
      })

      if (res.ok) {
        setExpenseForm({
          category: 'Labour',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
        })
        fetchProjectDetails()
        onRefresh()
      } else {
        const data = await res.json()
        setExpenseError(data.error || 'Failed to log expense.')
      }
    } catch (err) {
      setExpenseError('Network failure.')
    } finally {
      setSavingExpense(false)
    }
  }

  const formDataShorten = (desc) => {
    return desc.trim()
  }

  // Recharts Expense Pie Chart Data preparation
  const getExpensePieData = () => {
    const cats = {}
    project.expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount
    })
    return Object.keys(cats).map(name => ({
      name,
      value: cats[name]
    }))
  }

  const expensePieData = getExpensePieData()

  // Chart.js Doughnut config
  const doughnutData = {
    labels: expensePieData.map(d => d.name),
    datasets: [
      {
        data: expensePieData.map(d => d.value),
        backgroundColor: expensePieData.map((_, index) => COLORS[index % COLORS.length]),
        borderColor: '#0f172a',
        borderWidth: 2,
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${formatINR(context.raw)}`;
          }
        },
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
      }
    },
    cutout: '70%'
  }

  // Helper styles for badges
  const getHealthStyle = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'At Risk': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'Delayed': return 'bg-rose-50 text-rose-700 border border-rose-200'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ── Project Switcher & Header ── */}
      <div className="glass-panel p-5 rounded-xl border-slate-800/80 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
        
        {/* Dropdown Project Switcher & Metadata */}
        <div className="space-y-2 w-full lg:w-auto">
          <div className="relative inline-block w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 uppercase">Project</span>
            <select
              value={project.id}
              onChange={(e) => onChangeProject(parseInt(e.target.value))}
              className="w-full bg-slate-950/60 border border-slate-850 pl-20 pr-10 py-2.5 rounded-lg text-sm text-white font-bold font-display focus-ring appearance-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200 font-sans font-medium">{p.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4.5 h-4.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-500" /> <span className="font-semibold text-slate-300">{project.client}</span></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Start: {project.start_date}</div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> End: {project.end_date}</div>
          </div>
        </div>

        {/* Global Progress Indicators */}
        <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800/60">
          
          <div className="text-right space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Work Completed</span>
            <span className="text-2xl font-display font-extrabold text-white">{project.completion_percentage}%</span>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Health Status</span>
            
            {/* Quick health badge selector */}
            <div className="relative group inline-block">
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full cursor-pointer transition-all hover:opacity-85 ${getHealthStyle(project.health_status)}`}>
                {project.health_status}
              </span>
              {/* Role restriction tooltips */}
              <div className="absolute right-0 top-7 hidden group-hover:flex flex-col bg-slate-900 border border-slate-850 p-1.5 rounded-lg shadow-xl text-[10px] text-slate-300 font-semibold space-y-1 z-35 min-w-[100px] text-center">
                <span className="text-slate-500 border-b border-slate-800 pb-0.5 mb-0.5">Change Health</span>
                {['On Track', 'At Risk', 'Delayed'].map(st => (
                  <button 
                    key={st}
                    onClick={() => handleHealthBadgeToggle(st)}
                    className="hover:bg-slate-800 px-2 py-0.5 rounded text-left transition-colors"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex border-b border-slate-800/60 gap-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-orange-600 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Status & Timeline
        </button>

        {/* Differentiated Access for Finance Tabs */}
        {(role === 'Admin' || role === 'Client') && (
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'revenue'
                ? 'border-orange-600 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Revenue & Payments
          </button>
        )}
        {role === 'Admin' && (
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'expense'
                ? 'border-orange-600 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Cost & Expenses
          </button>
        )}
      </div>

      {/* ── Tab Views ── */}

      {/* ── TAB A: STATUS & TIMELINE VIEW ── */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Timeline Milestones Checklists (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-500" />
                  Chronological Milestones
                </h3>
                <span className="text-[10px] bg-slate-950 px-2.5 py-1 text-slate-400 rounded-full font-bold">
                  {project.milestones.filter(m => m.completed === 1).length}/{project.milestones.length} Completed
                </span>
              </div>

              {/* Milestones checklist */}
              <div className="space-y-3.5">
                {project.milestones.map((m) => (
                  <div 
                    key={m.id}
                    onClick={() => {
                      if (role !== 'Client') {
                        handleToggleMilestone(m.id)
                      }
                    }}
                    className={`flex items-start justify-between gap-3.5 p-3 rounded-lg border transition-all select-none group/m ${
                      role !== 'Client' ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      m.completed === 1
                        ? 'bg-emerald-950/10 border-emerald-900/40 text-slate-400'
                        : 'bg-slate-950/30 border-slate-850 hover:bg-slate-900/30 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button 
                        disabled={role === 'Client'}
                        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                      >
                        {m.completed === 1 ? (
                          <div className="w-4.5 h-4.5 bg-emerald-500 text-slate-950 rounded flex items-center justify-center font-bold text-xs">✓</div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded border-2 border-slate-700 hover:border-slate-500" />
                        )}
                      </button>
                      <div className="space-y-0.5">
                        <p className={`text-xs font-semibold leading-tight ${m.completed === 1 ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {m.name}
                        </p>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          Due: {new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete milestone button */}
                    {role !== 'Client' && (
                      <button
                        onClick={(e) => handleDeleteMilestone(e, m.id)}
                        className="p-1 rounded text-slate-600 hover:text-red-500 hover:bg-slate-900 opacity-0 group-hover/m:opacity-100 transition-opacity"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Inline Add Milestone form */}
              {role !== 'Client' && (
                <form onSubmit={handleAddMilestone} className="pt-4 border-t border-slate-800/60 space-y-3 animate-slide-up">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Add Milestone task</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Milestone description..."
                      value={newMilestoneName}
                      onChange={(e) => setNewMilestoneName(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950/60 border border-slate-850 text-xs rounded-lg text-slate-200 focus-ring placeholder-slate-600"
                    />
                    <input
                      type="date"
                      required
                      value={newMilestoneDate}
                      onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950/60 border border-slate-850 text-xs rounded-lg text-slate-200 focus-ring"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingMilestone || !newMilestoneName.trim() || !newMilestoneDate}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors focus-ring"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Milestone
                  </button>
                </form>
              )}
            </div>

            {/* Target Progress Controls (Completion % Slider) */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-4">
              <div className="pb-3 border-b border-slate-800/60">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Target Progress Control
                </h3>
                <p className="text-[10px] text-slate-500">Update progress directly using the linear controls below.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Slider Percentage</span>
                  <span className="text-orange-500 font-extrabold font-mono text-base">{project.completion_percentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={role === 'Client'}
                  value={project.completion_percentage}
                  onChange={handleProgressSliderChange}
                  className={`w-full h-2 bg-slate-950 rounded-lg appearance-none accent-orange-600 ${role === 'Client' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <span className="text-[10px] text-slate-500 block leading-normal italic">
                  {role === 'Client' ? '* Client access is read-only for progress parameters.' : '* Note: Sliding changes progress instantly in the database and automatically evaluates the project health status indicator.'}
                </span>
              </div>
            </div>

          </div>

          {/* Timeline Progress Notes Feed (Right 7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-5 rounded-xl border-slate-800/80 space-y-5">
            
            {/* Header */}
            <div className="pb-3 border-b border-slate-800/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Progress Notes timeline
              </h3>
              <p className="text-[10px] text-slate-500">Official log entries regarding site audits and progress milestones.</p>
            </div>

            {/* Note Appending Form */}
            {role !== 'Client' && (
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Append a fresh progress note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950/60 border border-slate-850 text-xs rounded-lg text-slate-200 focus-ring placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={savingNote || !newNote.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-all focus-ring"
                >
                  <Send className="w-3.5 h-3.5" />
                  Append
                </button>
              </form>
            )}

            {/* Timeline Feed Container */}
            <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
              {project.notes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No notes written for this project.</div>
              ) : (
                project.notes.map((note, index) => (
                  <div key={note.id} className="relative flex gap-4 animate-slide-up">
                    
                    {/* Timeline line */}
                    {index !== project.notes.length - 1 && (
                      <div className="absolute left-[13px] top-6 bottom-[-20px] w-[2px] bg-slate-800/60" />
                    )}

                    {/* Timeline dot */}
                    <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center flex-shrink-0 text-slate-400 z-10 font-bold text-[9px] uppercase">
                      {note.author.slice(0,2)}
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1 bg-slate-950/40 border border-slate-900 p-3 rounded-xl space-y-1.5 group/n">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-amber-500">{note.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">
                            {new Date(note.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                          </span>
                          
                          {/* Trash button to delete note */}
                          {role === 'Admin' && (
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-0.5 rounded text-slate-600 hover:text-rose-500 hover:bg-slate-900 opacity-0 group-hover/n:opacity-100 transition-opacity"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {note.text}
                      </p>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* ── TAB B: REVENUE & CONTRACT PAYMENT LOG ── */}
      {activeTab === 'revenue' && (role === 'Admin' || role === 'Client') && (
        <div className="space-y-6">
          
          {/* Financial Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Value */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Total Contract Value</span>
                <h4 className="text-xl font-display font-extrabold text-white mt-1">{formatINR(project.contract_value)}</h4>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg">
                <Briefcase className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Collected */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Amount Received</span>
                <h4 className="text-xl font-display font-extrabold text-emerald-400 mt-1">{formatINR(project.amount_received)}</h4>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                <IndianRupee className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Outstanding */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outstanding Balance</span>
                <h4 className="text-xl font-display font-extrabold text-rose-500 mt-1">{formatINR(project.outstanding_balance)}</h4>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg">
                <CreditCard className="w-5.5 h-5.5" />
              </div>
            </div>

          </div>

          {/* Overdue Payment Warning Banner */}
          {project.outstanding_balance > (0.3 * project.contract_value) && (
            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl flex items-start sm:items-center gap-3.5 text-xs text-rose-300">
              <AlertTriangle className="w-5.5 h-5.5 text-rose-500 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 space-y-1">
                <h5 className="font-bold text-rose-200">Overdue Payment Warning</h5>
                <p className="leading-relaxed">
                  Outstanding balance of {formatINR(project.outstanding_balance)} has exceeded 30% of total contract value. Please initiate payment audits and billing reminders.
                </p>
              </div>
            </div>
          )}

          {/* Payment tracking matrix */}
          <div className="glass-panel rounded-xl border-slate-800/80 overflow-hidden">
            
            {/* Header & Payment Add utility CTA */}
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Payment Tracking Invoice Log
              </h3>
              {role === 'Admin' && (
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-[11px] text-amber-500 font-bold uppercase rounded-lg transition-colors focus-ring"
                >
                  <PlusCircle className="w-4 h-4" />
                  Record Invoice Payment
                </button>
              )}
            </div>

            {/* Inline Payment Entry Form */}
            {showPaymentForm && (
              <form onSubmit={handleAddPayment} className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4 animate-slide-up">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Record Received Payment</h4>
                {paymentError && <p className="text-xs text-rose-400">{paymentError}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-slate-200 focus-ring placeholder-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Mode</label>
                    <select
                      value={paymentForm.payment_mode}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-slate-200 focus-ring"
                    >
                      <option value="Online">Online</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Reference ID</label>
                    <input
                      type="text"
                      value={paymentForm.reference_id}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_id: e.target.value }))}
                      required
                      placeholder="TXN..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-slate-200 focus-ring placeholder-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Date</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs rounded-lg text-slate-200 focus-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="px-5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {savingPayment ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}

            {/* Payment log table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-3.5">Invoice Date</th>
                    <th className="px-5 py-3.5">Reference ID</th>
                    <th className="px-5 py-3.5">Payment Mode</th>
                    <th className="px-5 py-3.5 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40">
                  {project.payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-medium">No payments received log recorded.</td>
                    </tr>
                  ) : (
                    project.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/20 text-slate-300 font-medium">
                        <td className="px-5 py-4 font-mono">{p.date}</td>
                        <td className="px-5 py-4 font-semibold text-slate-400">{p.reference_id}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.payment_mode === 'Online' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' :
                            p.payment_mode === 'Cheque' ? 'bg-amber-950/40 text-amber-500 border border-amber-900/40' :
                            'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                          }`}>
                            {p.payment_mode}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-emerald-400 font-extrabold">{formatINR(p.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB C: COST & EXPENSE LOG MANAGEMENT (Strictly Admin) ── */}
      {activeTab === 'expense' && role === 'Admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Logger form & summary (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Running cost card */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Operational Expenditures</span>
                <h4 className="text-2xl font-display font-extrabold text-orange-500 mt-1">{formatINR(project.total_expenses)}</h4>
              </div>
              <div className="p-3 bg-orange-600/10 text-orange-500 border border-orange-500/20 rounded-lg">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            {/* Expense Logger Entry Form */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-4">
              <div className="pb-3 border-b border-slate-800/60">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Expense Logger Form
                </h3>
                <p className="text-[10px] text-slate-500">Log standard daily operational expenditures below.</p>
              </div>

              {expenseError && <p className="text-xs text-rose-400 font-semibold">{expenseError}</p>}

              <form onSubmit={handleAddExpense} className="space-y-4">
                
                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Expense Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus-ring"
                  >
                    <option value="Labour">Labour</option>
                    <option value="Materials">Materials</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    placeholder="e.g. 150000"
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus-ring placeholder-slate-700"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus-ring"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Description</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows="2"
                    placeholder="Purchase details, labor counts, etc..."
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus-ring placeholder-slate-700 resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-orange-600/10 focus-ring"
                >
                  {savingExpense ? 'Logging Expense...' : 'Log Expense'}
                </button>

              </form>
            </div>

          </div>

          {/* Graph and details ledger (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Pie Chart category breakdown */}
            <div className="glass-panel p-5 rounded-xl border-slate-800/80 space-y-4">
              <div className="pb-3 border-b border-slate-800/60">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-orange-500" />
                  Expenses by Category Breakdown
                </h3>
              </div>

              {expensePieData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No logged expenses to graph.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  
                  {/* Chart.js Doughnut container */}
                  <div className="h-44 w-full flex items-center justify-center">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2.5">
                    {expensePieData.map((item, index) => {
                      const pct = ((item.value / project.total_expenses) * 100).toFixed(0)
                      return (
                        <div key={item.name} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="font-medium text-slate-400">{item.name}</span>
                          </div>
                          <span className="font-bold text-white font-mono">{pct}% ({formatINR(item.value)})</span>
                        </div>
                      )
                    })}
                  </div>

                </div>
              )}
            </div>

            {/* Expenses List Log */}
            <div className="glass-panel rounded-xl border-slate-800/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/30">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Logged Site Expenses</h3>
              </div>
              <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {project.expenses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-slate-500 font-medium">No expenses logged yet.</td>
                      </tr>
                    ) : (
                      project.expenses.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-900/20 text-slate-300 font-medium">
                          <td className="px-4 py-3 font-mono">{e.date}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-800">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 truncate max-w-[150px] text-slate-400" title={e.description}>{e.description}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-orange-500">{formatINR(e.amount)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-500 hover:bg-slate-900 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
