import React, { useEffect } from 'react'
import { CheckCircle, AlertOctagon, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-500" />}
          {type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white leading-normal">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-0.5 rounded hover:bg-slate-850 text-slate-500 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
