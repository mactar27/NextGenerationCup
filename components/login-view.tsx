// components/login-view.tsx
'use client'

import React, { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginViewProps {
  onLoginSuccess: (user: any) => void
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect.')
      }

      onLoginSuccess(data.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0d2a1c]">
      {/* Arrière-plan terrain de football avec projecteurs et filtre vert sombre comme sur la maquette */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at top, rgba(21, 122, 56, 0.45), transparent 70%), linear-gradient(180deg, #071912 0%, #0d2a1c 45%, #05140e 100%)'
        }}
      />
      {/* Texture de terrain subtile en arrière-plan */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#157a38_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Carte Blanche Centrale */}
      <div className="relative z-10 w-full max-w-[430px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col items-center">
        {/* Logo Next Generation Cup */}
        <div className="mb-4">
          <img
            src="/logo-next-gen-cup.jpg"
            alt="Next Generation Cup - Teranga Agency"
            className="h-28 w-auto object-contain mx-auto"
          />
        </div>

        {/* Titres */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center">
          Espace d'administration
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 text-center font-medium">
          Gestion officielle du tournoi 2026
        </p>

        {error && (
          <div className="w-full mb-4 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Identifiant ou e-mail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Identifiant ou e-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin ou identifiant dirigeant"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#157a38] focus:ring-2 focus:ring-[#157a38]/20 transition bg-slate-50/50"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#157a38] focus:ring-2 focus:ring-[#157a38]/20 transition bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Mot de passe oublié */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => alert("Veuillez contacter l'administrateur principal de Teranga Agency pour réinitialiser vos accès.")}
              className="text-xs font-semibold text-[#157a38] hover:underline cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton de connexion vert maquette */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white font-bold text-sm shadow-md shadow-emerald-900/20 transition disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-slate-400 text-center font-medium">
          Accès réservé aux équipes autorisées
        </p>

        {/* Signature WockyTech */}
        <div className="mt-4 pt-3 border-t border-slate-100 w-full text-center">
          <p className="text-[11px] text-slate-500">
            Réalisé par{' '}
            <a
              href="https://www.wockytech.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#157a38] hover:underline"
            >
              WockyTech
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
