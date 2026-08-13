import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-sjec-navy flex items-center justify-center text-white font-bold text-xl shadow-md">
            SJEC
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sjec-navy">Patent Management System</h1>
            <p className="text-sm text-slate-500">Innovation Centre Web Portal — SJEC</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-emerald-800 text-sm">
          <strong>✅ Project Scaffolded Successfully!</strong> Backend and Frontend configurations are initialized and ready for feature development.
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-slate-700">Quick Stats & Links:</h2>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sjec-blue"></span>
              <span>Backend API base: <code className="bg-slate-100 px-2 py-0.5 rounded border text-xs">/api/v1/</code></span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sjec-gold"></span>
              <span>Auth endpoints: <code className="bg-slate-100 px-2 py-0.5 rounded border text-xs">/api/v1/auth/login/</code>, <code className="bg-slate-100 px-2 py-0.5 rounded border text-xs">/register/</code></span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Patents endpoint: <code className="bg-slate-100 px-2 py-0.5 rounded border text-xs">/api/v1/patents/</code></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
