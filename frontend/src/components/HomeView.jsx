import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  ArrowRight, 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Briefcase, 
  ShieldCheck,
  Activity,
  CalendarClock,
  Sparkles,
  FileText,
  AlertOctagon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { formatINR } from './DashboardView'

export default function HomeView({ projects, summary, role, onNavigate, userName }) {
  const [recentReports, setRecentReports] = useState([])
  const [recentIssues, setRecentIssues] = useState([])

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const repRes = await fetch('/api/reports')
        const repData = await repRes.json()
        setRecentReports(repData.slice(0, 3))

        const issRes = await fetch('/api/issues')
        const issData = await issRes.json()
        setRecentIssues(issData.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').slice(0, 3))
      } catch (e) {
        console.error("Failed to load snapshot logs for home view:", e)
      }
    }
    fetchRecent()
  }, [])

  // Get current greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Get current date string
  const getDateString = () => {
    return new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    })
  }

  // Projects health breakdown
  const onTrack = projects.filter(p => p.health_status === 'On Track').length
  const atRisk = projects.filter(p => p.health_status === 'At Risk').length
  const delayed = projects.filter(p => p.health_status === 'Delayed').length

  // Average completion
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + p.completion_percentage, 0) / projects.length)
    : 0

  // Nearest deadline project
  const upcomingProject = [...projects]
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .find(p => new Date(p.end_date) >= new Date())

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/60">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative px-6 lg:px-10 py-8 lg:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>{getDateString()}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-white leading-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">{userName}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Welcome to <strong className="text-slate-200">ProjectTrack</strong> — the centralized command centre for Dhatri Constructions. 
              Monitor active sites, track financial health, and manage project milestones from one unified platform.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-orange-600/20 focus-ring"
              >
                <LayoutDashboard className="w-4 h-4" />
                Open Dashboard
              </button>
              {role === 'Admin' && (
                <button
                  onClick={() => onNavigate('analytics')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </button>
              )}
            </div>
          </div>

          {/* Right side brand icon */}
          <div className="hidden lg:flex flex-col items-center gap-3 opacity-60">
            <div className="w-24 h-24 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-orange-500" />
            </div>
            <div className="text-center">
              <span className="text-xs font-display font-bold text-slate-400 tracking-widest uppercase">Dhatri</span>
              <span className="block text-[9px] text-amber-500/80 font-semibold tracking-[0.3em] uppercase">Constructions</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Navigation Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Dashboard Card */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="group glass-panel p-5 rounded-xl border-slate-800/80 text-left space-y-3 hover:border-orange-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-600/20 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dashboard</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Active projects list, health filters, KPIs and summaries.</p>
          </div>
        </button>

        {/* Workspace Card */}
        <button
          onClick={() => onNavigate('workspace')}
          className="group glass-panel p-5 rounded-xl border-slate-800/80 text-left space-y-3 hover:border-blue-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <FolderKanban className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Workspace</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Interactive timeline, payments entries, and expense ledger.</p>
          </div>
        </button>

        {/* Analytics Card */}
        <button
          onClick={() => onNavigate(role === 'Admin' ? 'analytics' : 'dashboard')}
          className={`group glass-panel p-5 rounded-xl border-slate-800/80 text-left space-y-3 transition-all cursor-pointer ${role === 'Admin' ? 'hover:border-emerald-500/30' : 'opacity-50 cursor-not-allowed'}`}
          disabled={role !== 'Admin'}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${role === 'Admin' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-slate-800/50 border-slate-800 text-slate-600'} transition-colors`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            {role === 'Admin' ? (
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-slate-700" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analytics</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Profit margins, cash inflows and monthly revenue charts.</p>
          </div>
        </button>

        {/* Reports Card */}
        <button
          onClick={() => onNavigate('reports')}
          className="group glass-panel p-5 rounded-xl border-slate-800/80 text-left space-y-3 hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reports</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Project reports lists, progress records, safety audits.</p>
          </div>
        </button>

        {/* Issues Card */}
        <button
          onClick={() => onNavigate('issues')}
          className="group glass-panel p-5 rounded-xl border-slate-800/80 text-left space-y-3 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-colors">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-500 transition-colors" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Issues</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Deviation files, site risks, severity tags and tracking.</p>
          </div>
        </button>

      </div>

      {/* ── Live Snapshot Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Project Health Overview (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-xl border-slate-800/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/30">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Live Project Snapshot
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Real-time
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Health bars */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-3 text-center space-y-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xl font-display font-extrabold text-emerald-400">{onTrack}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">On Track</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-3 text-center space-y-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-450 flex-shrink-0" />
                  <span className="text-xl font-display font-extrabold text-amber-450">{atRisk}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">At Risk</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-3 text-center space-y-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xl font-display font-extrabold text-rose-400">{delayed}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Delayed</p>
              </div>
            </div>

            {/* Average completion bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Portfolio Average Completion</span>
                <span className="text-orange-500 font-extrabold font-mono text-base">{avgCompletion}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="gradient-accent h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${avgCompletion}%` }}
                />
              </div>
            </div>

            {/* Active projects mini list */}
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {projects.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('workspace', p.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-850 hover:bg-slate-900/30 hover:border-slate-800 transition-all group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
                      p.health_status === 'On Track' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 
                      p.health_status === 'At Risk' ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 
                      'bg-rose-400 shadow-sm shadow-rose-400/50'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{p.name}</p>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {p.client}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-300 font-mono">{p.completion_percentage}%</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Contract Pipeline card */}
          <div className="glass-panel rounded-xl border-slate-800/80 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              Contract Pipeline
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Active Sites</span>
                <span className="text-xl font-display font-extrabold text-white">{summary.total_active_projects}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/40 rounded-lg p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Alerts</span>
                <span className="text-xl font-display font-extrabold text-rose-400">{summary.total_active_alerts}</span>
              </div>
            </div>

            {role === 'Admin' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Total Contract Value</span>
                  <span className="text-white font-bold">{formatINR(summary.total_contract_value)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Outstanding Dues</span>
                  <span className="text-rose-400 font-bold">{formatINR(summary.total_outstanding_dues)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Deadline */}
          {upcomingProject && (
            <div className="glass-panel rounded-xl border-slate-800/80 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Nearest Deadline
              </h4>
              <button
                onClick={() => onNavigate('workspace', upcomingProject.id)}
                className="w-full bg-slate-950/40 border border-slate-800/40 rounded-lg p-4 text-left hover:border-slate-700 transition-all group"
              >
                <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{upcomingProject.name}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(upcomingProject.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
                    upcomingProject.health_status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    upcomingProject.health_status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {upcomingProject.health_status === 'On Track' && <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />}
                    {upcomingProject.health_status === 'At Risk' && <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />}
                    {upcomingProject.health_status === 'Delayed' && <AlertOctagon className="w-2.5 h-2.5 flex-shrink-0" />}
                    <span>{upcomingProject.health_status}</span>
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-white font-bold">{upcomingProject.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="gradient-accent h-full rounded-full" style={{ width: `${upcomingProject.completion_percentage}%` }} />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* System info card */}
          <div className="glass-panel rounded-xl border-slate-800/80 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform</h4>
                <p className="text-sm font-bold text-white font-display">ProjectTrack v1.0</p>
                <p className="text-[10px] text-slate-500">Dhatri Constructions, Hyderabad</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Reports and Issues Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="glass-panel rounded-xl border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Recent Compliance & Progress Reports
            </h4>
            <button onClick={() => onNavigate('reports')} className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No reports recorded.</p>
            ) : (
              recentReports.map(rep => (
                <div key={rep.id} className="flex justify-between items-center bg-slate-950/20 border border-slate-850 p-3 rounded-lg text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{rep.title}</p>
                    <span className="text-[10px] text-slate-500">{rep.project_name} • {rep.generated_by}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">{rep.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="glass-panel rounded-xl border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              Active Engineering Risks & Issues
            </h4>
            <button onClick={() => onNavigate('issues')} className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentIssues.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No active issues logged.</p>
            ) : (
              recentIssues.map(iss => (
                <div key={iss.id} className="flex justify-between items-center bg-slate-950/20 border border-slate-850 p-3 rounded-lg text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{iss.title}</p>
                    <span className="text-[10px] text-slate-500">{iss.project_name} • Status: <strong className="text-slate-450">{iss.status}</strong></span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold border ${
                    iss.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    iss.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>{iss.severity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
