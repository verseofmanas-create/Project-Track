import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Menu,
  X,
  User,
  Users,
  Shield,
  Building2,
  ChevronRight,
  Home,
  Camera,
  Trash2,
  FileText,
  AlertOctagon,
  LogOut
} from 'lucide-react'
import HomeView from './components/HomeView'
import DashboardView from './components/DashboardView'
import ProjectWorkspaceView from './components/ProjectWorkspaceView'
import AnalyticsView from './components/AnalyticsView'
import LoginView from './components/LoginView'
import ReportsView from './components/ReportsView'
import IssuesView from './components/IssuesView'
import UsersView from './components/UsersView'
import Toast from './components/Toast'

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('projecttrack_user')
    return saved ? JSON.parse(saved) : null
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('projecttrack_token')
  })
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('projecttrack_user')
    if (saved) {
      const u = JSON.parse(saved)
      return u.role
    }
    return 'Admin'
  })
  const [activeView, setActiveView] = useState('home') // 'home', 'dashboard', 'workspace', 'analytics', 'reports', 'issues'
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Toast notifications state
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }


  // Sync role when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role)
      // Also update user profile with authenticated user's name
      setUserProfile(prev => ({
        ...prev,
        name: currentUser.full_name,
        location: currentUser.location || prev.location
      }))
    }
  }, [currentUser])

  // Fetch user profile on mount to sync/verify session and prevent stale localStorage issues
  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem('projecttrack_token')
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            if (data.user) {
              setCurrentUser(data.user)
              setRole(data.user.role)
              localStorage.setItem('projecttrack_user', JSON.stringify(data.user))
            }
          } else {
            handleLogout()
          }
        } catch (e) {
          console.error("Failed to sync user session:", e)
        }
      }
    }
    syncUser()
  }, [])

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error("Logout failed:", e)
    } finally {
      localStorage.removeItem('projecttrack_token')
      localStorage.removeItem('projecttrack_user')
      setIsAuthenticated(false)
      setCurrentUser(null)
      setActiveView('home')
    }
  }

  // Profile State
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('projecttrack_user_profile')
    return saved ? JSON.parse(saved) : { name: 'Manas Abhishek', location: 'Hyderabad', avatar: '' }
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: userProfile.name, location: userProfile.location, avatar: userProfile.avatar })

  // Open profile editor
  const openProfileModal = () => {
    setProfileForm({ name: userProfile.name, location: userProfile.location, avatar: userProfile.avatar })
    setIsProfileModalOpen(false) // toggle logic
    setIsProfileModalOpen(true)
  }

  // Handle image upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Save changes
  const handleSaveProfile = (e) => {
    e.preventDefault()
    if (!profileForm.name.trim() || !profileForm.location.trim()) return
    setUserProfile(profileForm)
    localStorage.setItem('projecttrack_user_profile', JSON.stringify(profileForm))
    setIsProfileModalOpen(false)
  }


  const [projects, setProjects] = useState([])
  const [summary, setSummary] = useState({
    total_active_projects: 0,
    total_contract_value: 0,
    total_outstanding_dues: 0,
    total_active_alerts: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true)
      const projRes = await fetch('/api/projects')
      const projData = await projRes.json()
      setProjects(projData)

      const sumRes = await fetch('/api/analytics/summary')
      const sumData = await sumRes.json()
      setSummary(sumData)

      // Auto select first project if none is selected
      if (projData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error)
    } finally {
      // Add a small artificial delay to show off beautiful loading skeletons
      setTimeout(() => setLoading(false), 800)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Enforce role lockout: if not Admin, block analytics
  useEffect(() => {
    if (role !== 'Admin' && activeView === 'analytics') {
      setActiveView('home')
    }
  }, [role, activeView])

  // Refresh projects lists
  const handleRefresh = async () => {
    try {
      const projRes = await fetch('/api/projects')
      const projData = await projRes.json()
      setProjects(projData)

      const sumRes = await fetch('/api/analytics/summary')
      const sumData = await sumRes.json()
      setSummary(sumData)
    } catch (e) {
      console.error("Error refreshing data:", e)
    }
  }

  // Navigate to Project Workspace Deep-Dive
  const handleViewProjectDetails = (id) => {
    setSelectedProjectId(id)
    setActiveView('workspace')
  }

  // Navigate from Home view
  const handleHomeNavigate = (view, projectId) => {
    if (projectId) setSelectedProjectId(projectId)
    setActiveView(view)
  }

  // Breadcrumbs Generator
  const getBreadcrumbs = () => {
    const activeProject = projects.find(p => p.id === selectedProjectId)
    const trail = [
      { label: 'Home', view: 'home' }
    ]

    if (activeView === 'home') {
      // No extra crumbs for home
    } else if (activeView === 'dashboard') {
      trail.push({ label: 'Dashboard', view: 'dashboard' })
    } else if (activeView === 'workspace') {
      trail.push({ label: 'Dashboard', view: 'dashboard' })
      trail.push({
        label: activeProject ? activeProject.name : 'Workspace',
        view: 'workspace'
      })
    } else if (activeView === 'analytics') {
      trail.push({ label: 'Financial Analytics', view: 'analytics' })
    } else if (activeView === 'reports') {
      trail.push({ label: 'Project Reports', view: 'reports' })
    } else if (activeView === 'issues') {
      trail.push({ label: 'Issues & Risks', view: 'issues' })
    } else if (activeView === 'users') {
      trail.push({ label: 'User Management', view: 'users' })
    }
    return trail
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user)
          setIsAuthenticated(true)
        }}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* ── Sidebar (Desktop Persistent / Mobile Overlay) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:h-full flex-shrink-0 flex-col
        ${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-sm leading-tight text-white tracking-wide">
                DHATRI
              </h1>
              <p className="text-[10px] text-amber-500 font-semibold tracking-widest uppercase">
                Constructions
              </p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="space-y-1 flex-1 overflow-y-auto pr-1 pb-32">
          <button
            onClick={() => { setActiveView('home'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'home'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <Home className={`w-5 h-5 transition-colors ${activeView === 'home' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'dashboard'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-colors ${activeView === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveView('workspace'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'workspace'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <FolderKanban className={`w-5 h-5 transition-colors ${activeView === 'workspace' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span>Project Workspace</span>
          </button>

          {/* Analytics Locked out for Site Manager */}
          {role === 'Admin' && (
            <button
              onClick={() => { setActiveView('analytics'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'analytics'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <BarChart3 className={`w-5 h-5 transition-colors ${activeView === 'analytics' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
              <span>Financial Analytics</span>
            </button>
          )}

          <button
            onClick={() => { setActiveView('reports'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'reports'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <FileText className={`w-5 h-5 transition-colors ${activeView === 'reports' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span>Project Reports</span>
          </button>

          <button
            onClick={() => { setActiveView('issues'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'issues'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <AlertOctagon className={`w-5 h-5 transition-colors ${activeView === 'issues' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span>Issues & Risks</span>
          </button>

          {role === 'Admin' && (
            <button
              onClick={() => { setActiveView('users'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${activeView === 'users'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <Users className={`w-5 h-5 transition-colors ${activeView === 'users' ? 'text-white' : 'text-slate-400 group-hover:text-amber-500'}`} />
              <span>User Management</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer Role Card & Logout */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <div className="p-4 rounded-xl glass-panel bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${role === 'Admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Role</p>
                <h4 className="text-sm font-bold text-white leading-tight">{role}</h4>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-450 hover:text-rose-400 bg-rose-955/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Header Navbar ── */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex-shrink-0"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            {/* Breadcrumb Utility */}
            <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 min-w-0 overflow-hidden">
              <span className="text-slate-500 hover:text-white cursor-pointer transition-colors" onClick={() => setActiveView('home')}>
                <Home className="w-3.5 h-3.5" />
              </span>
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span
                    onClick={() => setActiveView(b.view)}
                    className={`cursor-pointer transition-colors max-w-[180px] truncate ${i === getBreadcrumbs().length - 1
                      ? 'text-white font-semibold cursor-default pointer-events-none'
                      : 'hover:text-amber-500'
                      }`}
                  >
                    {b.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
            <span className="md:hidden font-display font-semibold text-sm text-white truncate max-w-[180px]">
              Dhatri | ProjectTrack
            </span>
          </div>

          {/* Role Enforcement Switcher & User Profile */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {/* Toggle switch for role (Admin can switch to any, others are locked to their own) */}
            <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800/80 p-0.5 sm:p-1 rounded-xl">
              <button
                disabled={currentUser && currentUser.role !== 'Admin'}
                onClick={() => setRole('Admin')}
                className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition-all ${role === 'Admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold'
                  : 'text-slate-400 hover:text-white'
                  } ${currentUser && currentUser.role !== 'Admin' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Admin
              </button>
              <button
                disabled={currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Site Manager'}
                onClick={() => setRole('Site Manager')}
                className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition-all ${role === 'Site Manager'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold'
                  : 'text-slate-400 hover:text-white'
                  } ${currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Site Manager' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Manager
              </button>
              <button
                disabled={currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Client'}
                onClick={() => setRole('Client')}
                className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold tracking-wide transition-all ${role === 'Client'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold'
                  : 'text-slate-400 hover:text-white'
                  } ${currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Client' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Client
              </button>
            </div>

            {/* Profile */}
            <button
              onClick={openProfileModal}
              className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-800/60 text-left hover:opacity-80 transition-opacity focus:outline-none"
              title="Edit Profile"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm overflow-hidden flex-shrink-0">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="text-left leading-none">
                <h4 className="text-xs font-bold text-white max-w-[110px] truncate">{userProfile.name}</h4>
                <span className="text-[10px] text-slate-500 font-medium font-sans max-w-[110px] truncate block mt-0.5">{userProfile.location}</span>
              </div>
            </button>
          </div>
        </header>

        {/* ── Page View Area ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">

          {loading ? (
            /* Premium Loading Skeleton */
            <div className="space-y-8 animate-pulse">
              <div className="flex flex-col gap-2">
                <div className="h-6 w-48 bg-slate-800 rounded-md" />
                <div className="h-4 w-72 bg-slate-800 rounded-md" />
              </div>
              {/* Metric Cards Skeleton */}
              {role === 'Admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-900/40 rounded-xl border border-slate-800/60" />
                  ))}
                </div>
              )}
              {/* Body Skeleton */}
              <div className="h-96 bg-slate-900/40 rounded-xl border border-slate-800/60" />
            </div>
          ) : (
            /* Router matching view selection */
            <>
              {activeView === 'home' && (
                <HomeView
                  projects={projects}
                  summary={summary}
                  role={role}
                  onNavigate={handleHomeNavigate}
                  userName={userProfile.name.split(' ')[0]}
                  showToast={showToast}
                />
              )}
              {activeView === 'dashboard' && (
                <DashboardView
                  projects={projects}
                  summary={summary}
                  role={role}
                  onViewDetails={handleViewProjectDetails}
                  onRefresh={handleRefresh}
                  showToast={showToast}
                />
              )}
              {activeView === 'workspace' && (
                <ProjectWorkspaceView
                  projectId={selectedProjectId}
                  role={role}
                  projects={projects} // to select project switchers
                  onChangeProject={setSelectedProjectId}
                  onRefresh={handleRefresh}
                  showToast={showToast}
                />
              )}
              {activeView === 'analytics' && role === 'Admin' && (
                <AnalyticsView
                  onRefresh={handleRefresh}
                  showToast={showToast}
                />
              )}
              {activeView === 'reports' && (
                <ReportsView
                  role={role}
                  projects={projects}
                  showToast={showToast}
                />
              )}
              {activeView === 'issues' && (
                <IssuesView
                  role={role}
                  projects={projects}
                  currentUser={currentUser}
                  showToast={showToast}
                />
              )}
              {activeView === 'users' && role === 'Admin' && (
                <UsersView
                  role={role}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Edit Profile Modal ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
          />

          {/* Content */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl animate-slide-up">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">Edit User Profile</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">

              {/* Photo Upload Area */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950/60">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-600" />
                  )}
                  {/* Hover Upload Overlay */}
                  <label
                    htmlFor="avatar-file-input"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-slate-200 font-bold uppercase tracking-wider cursor-pointer transition-opacity"
                  >
                    <Camera className="w-4.5 h-4.5 mb-1" />
                    Upload
                  </label>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <label
                    htmlFor="avatar-file-input"
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all"
                  >
                    Select Photo
                  </label>

                  {profileForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setProfileForm(prev => ({ ...prev, avatar: '' }))}
                      className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold uppercase transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Manas Abhishek"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Location</label>
                  <input
                    type="text"
                    required
                    value={profileForm.location}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Hyderabad"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus-ring placeholder-slate-700"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-lg shadow-orange-600/10"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}

