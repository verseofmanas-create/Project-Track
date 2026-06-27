import React, { useState } from 'react'
import { Building2, Shield, User, Key, AlertCircle, Briefcase } from 'lucide-react'

export default function LoginView({ onLoginSuccess }) {
  const [activePortal, setActivePortal] = useState('Admin')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const portals = {
    Admin: {
      name: 'Admin',
      title: 'DHATRI CORPORATE GATEWAY',
      subtitle: 'Admin Executive Console',
      accentClass: 'bg-orange-600 hover:bg-orange-500 text-white focus:ring-orange-500 shadow-orange-600/10 focus:ring-offset-orange-950',
      textAccent: 'text-amber-500',
      tabActive: 'border-orange-500 text-orange-400 bg-orange-500/5',
      borderFocus: 'focus:border-orange-500 focus:ring-orange-500',
      glowColor1: 'bg-orange-600/10',
      glowColor2: 'bg-amber-500/10',
      icon: <Building2 className="w-4 h-4" />,
      defaultUsername: 'admin',
      defaultPassword: 'admin123'
    },
    'Site Manager': {
      name: 'Manager',
      title: 'SITE OPERATIONS TERMINAL',
      subtitle: 'Site Supervisor Console',
      accentClass: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-blue-600/10 focus:ring-offset-blue-950',
      textAccent: 'text-blue-400',
      tabActive: 'border-blue-500 text-blue-400 bg-blue-500/5',
      borderFocus: 'focus:border-blue-500 focus:ring-blue-500',
      glowColor1: 'bg-blue-600/10',
      glowColor2: 'bg-indigo-500/10',
      icon: <Briefcase className="w-4 h-4" />,
      defaultUsername: 'manager',
      defaultPassword: 'manager123'
    },
    Client: {
      name: 'Client',
      title: 'CLIENT PROGRESS GATEWAY',
      subtitle: 'Customer Tracking Portal',
      accentClass: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-emerald-600/10 focus:ring-offset-emerald-950',
      textAccent: 'text-emerald-400',
      tabActive: 'border-emerald-500 text-emerald-450 bg-emerald-500/5',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500',
      glowColor1: 'bg-emerald-600/10',
      glowColor2: 'bg-teal-500/10',
      icon: <User className="w-4 h-4" />,
      defaultUsername: 'client',
      defaultPassword: 'client123'
    }
  }

  const currentPortal = portals[activePortal]

  const handlePortalChange = (portalName) => {
    setActivePortal(portalName)
    setUsername(portals[portalName].defaultUsername)
    setPassword(portals[portalName].defaultPassword)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store in localStorage
      localStorage.setItem('projecttrack_token', data.token)
      localStorage.setItem('projecttrack_user', JSON.stringify(data.user))

      // Trigger login callback
      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col justify-center py-4 sm:px-6 lg:px-8 relative overflow-hidden select-none transition-colors duration-500">
      {/* Dynamic Background Gradients */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${currentPortal.glowColor1} rounded-full blur-[120px] pointer-events-none transition-all duration-700`} />
      <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] ${currentPortal.glowColor2} rounded-full blur-[140px] pointer-events-none transition-all duration-700`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/30 ring-1 ring-orange-500/50">
            <Building2 className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-2xl font-extrabold text-white font-display tracking-tight">
          DHATRI CONSTRUCTIONS
        </h2>
        <p className="mt-1 text-center text-[10px] text-amber-500 font-semibold tracking-widest uppercase">
          Project Track Portal
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Portal Switcher Tabs */}
        <div className="flex border border-slate-800 bg-slate-900/50 rounded-t-2xl p-1 gap-1">
          {Object.keys(portals).map((portalName) => {
            const isActive = activePortal === portalName
            return (
              <button
                key={portalName}
                type="button"
                onClick={() => handlePortalChange(portalName)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? currentPortal.tabActive
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {portals[portalName].icon}
                <span>{portals[portalName].name}</span>
              </button>
            )
          })}
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/45 border-l border-r border-b border-slate-800/80 backdrop-blur-md py-5 px-6 shadow-2xl rounded-b-2xl sm:px-10 min-h-[430px] flex flex-col justify-between">
          
          <div className="text-center mb-4 h-10 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase">{currentPortal.title}</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">{currentPortal.subtitle}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl flex items-center gap-3 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 transition-colors text-base md:text-sm ${currentPortal.borderFocus}`}
                  placeholder={`Enter ${activePortal.toLowerCase()} username`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 transition-colors text-base md:text-sm ${currentPortal.borderFocus}`}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer ${currentPortal.accentClass}`}
              >
                {loading ? 'Authenticating...' : `Enter ${currentPortal.name}`}
              </button>
            </div>
          </form>

          {/* Demo Info Box */}
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <div className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3">
              <div className="flex gap-3">
                <Shield className={`h-4.5 w-4.5 ${currentPortal.textAccent} flex-shrink-0 mt-0.5`} />
                <div>
                  <h3 className="text-[10px] font-bold text-slate-350 tracking-wider uppercase">Demo Credentials</h3>
                  <div className="mt-2 text-xs space-y-1.5 text-slate-400 font-mono">
                    <div className={`flex justify-between p-1 rounded transition-colors ${activePortal === 'Admin' ? 'bg-orange-500/10 text-orange-400' : ''}`}>
                      <span>Admin:</span>
                      <span>admin / admin123</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded transition-colors ${activePortal === 'Site Manager' ? 'bg-blue-500/10 text-blue-400' : ''}`}>
                      <span>Site Manager:</span>
                      <span>manager / manager123</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded transition-colors ${activePortal === 'Client' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                      <span>Client:</span>
                      <span>client / client123</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
