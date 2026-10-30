// app/verify/[token]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle, Shield, Award, Calendar, Hash, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface LicenseVerification {
  valid: boolean
  status: string
  licenseNumber: string
  firstName: string
  lastName: string
  birthDate: string
  nationality: string
  jerseyNumber: number
  position: string
  teamName: string
  teamCode: string
  teamColor: string
  season: string
  issueDate: string
  expirationDate: string
  verifiedAt: string
}

export default function VerifyLicensePage() {
  const params = useParams()
  const token = params?.token as string
  const [data, setData] = useState<LicenseVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`/api/verify/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Licence introuvable.')
        }
        return res.json()
      })
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  return (
    <div className="min-h-screen bg-[#071912] text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-next-gen-cup.jpg"
              alt="Next Generation Cup - Teranga Agency"
              className="h-20 w-auto object-contain rounded-xl shadow-lg border border-emerald-500/20"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Shield size={14} /> Service Officiel de Contrôle
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
            Vérification de Licence
          </h1>
          <p className="text-sm text-emerald-300/80 mt-1">
            Next Generation Cup 2026 — Teranga Agency
          </p>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="animate-spin size-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Vérification de l'authenticité de la licence...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-8 text-center">
            <XCircle className="size-14 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">Licence Non Reconnue</h2>
            <p className="text-sm text-rose-300 mt-2">{error}</p>
            <p className="text-xs text-slate-500 mt-4">Ce QR code ne correspond à aucun enregistrement officiel ou a été révoqué.</p>
          </div>
        ) : data && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`rounded-2xl p-6 border ${
              data.valid
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-4">
                {data.valid ? (
                  <CheckCircle2 className="size-12 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="size-12 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {data.valid ? 'Licence Officielle Conforme' : 'Attention : Statut Non Valide'}
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {data.valid ? 'LICENCE ACTIVE' : data.status}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    Vérifié le {new Date(data.verifiedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Player Identity Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">N° de Licence</span>
                  <div className="text-lg font-mono font-bold text-amber-400">{data.licenseNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Saison</span>
                  <div className="text-sm font-semibold text-slate-200">{data.season}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Nom & Prénoms</div>
                  <div className="text-base font-bold text-white mt-0.5">{data.lastName} {data.firstName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Équipe</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">{data.teamName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Poste & Maillot</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    #{data.jerseyNumber} — {data.position}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Nationalité</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{data.nationality}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Date de naissance</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{data.birthDate}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Validité jusqu'au</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{data.expirationDate}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Retour à l'espace privé
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-600 mt-8">
        Plateforme Privée de Compétition Officielle — Tous droits réservés
      </footer>
    </div>
  )
}
