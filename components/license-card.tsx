// components/license-card.tsx
'use client'

import React from 'react'
import { Printer, Download } from 'lucide-react'

export interface LicenseData {
  licenseNumber: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace?: string
  nationality: string
  address?: string
  observations?: string
  jerseyNumber?: number
  position?: string
  teamName: string
  teamCode?: string
  teamLogoUrl?: string
  teamColor?: string
  season?: string
  issueDate?: string
  expirationDate: string
  status: string
  qrSvg?: string
  photoUrl?: string
}

export function LicenseCard({ license, onDownloadPdf }: { license: LicenseData; onDownloadPdf?: () => void }) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* 
        DOCUMENT OFFICIEL TYPE LIGUE PROFESSIONNELLE 
        Design 100% Responsive :
        - Sur mobile : S'adapte en pleine largeur sans débordement
        - Sur grand écran / impression : Conserve les proportions d'une vraie carte officielle
      */}
      <div className="w-full overflow-x-auto pb-2 flex justify-center">
        <div
          id={`license-${license.licenseNumber}`}
          className="w-full max-w-[560px] min-w-[320px] bg-[#fbfbfb] text-[#111827] rounded-sm p-4 sm:p-6 shadow-2xl border border-slate-300 relative overflow-hidden flex flex-col justify-between font-sans select-none"
          style={{
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* Motif zébré diagonal vert de sécurité sur le bord supérieur gauche */}
          <div
            className="absolute top-0 left-0 w-16 sm:w-24 h-36 sm:h-48 pointer-events-none opacity-85"
            style={{
              background: 'repeating-linear-gradient(-45deg, #0f3d23 0, #0f3d23 6px, transparent 6px, transparent 14px)',
              clipPath: 'polygon(0 0, 100% 0, 0 100%)'
            }}
          />

          {/* Filigrane officiel central discret */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <img
              src="/logo-teranga-agency.jpg"
              alt=""
              className="w-64 h-64 object-contain filter grayscale"
            />
          </div>

          {/* --- EN-TÊTE SUPÉRIEUR --- */}
          <div className="relative z-10 pl-10 sm:pl-16">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-teranga-agency.jpg"
                  alt="Teranga Agency"
                  className="h-10 w-10 object-contain rounded-md"
                />
              </div>
              <div className="text-center flex-1 pr-2 sm:pr-4">
                <div className="text-[12px] sm:text-[14px] font-black text-[#0f3d23] tracking-tight leading-tight uppercase">
                  Next Generation Cup
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-600 leading-tight mt-0.5">
                  Teranga Agency • Homologation Officielle
                </div>
              </div>
              <div className="text-right">
                <span className="text-[13px] sm:text-[16px] font-black tracking-tight text-[#0f3d23]">
                  {license.season || '2026/2027'}
                </span>
              </div>
            </div>

            {/* NOM & LOGO OFFICIEL DU CLUB */}
            <div className="flex flex-col items-center justify-center mt-2.5 sm:mt-3">
              <div className="flex items-center justify-center gap-2.5 max-w-full px-2">
                {license.teamLogoUrl ? (
                  <img
                    src={license.teamLogoUrl}
                    alt={license.teamName}
                    className="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0 shadow-xs"
                  />
                ) : (
                  <div
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-white font-black text-xs sm:text-sm tracking-wider shrink-0 shadow-xs border border-black/10"
                    style={{ backgroundColor: license.teamColor || '#157a38' }}
                  >
                    {(license.teamCode || license.teamName || 'CL').substring(0, 3)}
                  </div>
                )}
                <h2 className="text-[15px] sm:text-[19px] font-black uppercase tracking-wider text-slate-950 truncate">
                  {license.teamName}
                </h2>
              </div>
              <div className="w-16 sm:w-24 h-[1.5px] bg-slate-900 mx-auto mt-1" />
            </div>

            {/* TITRE DU DOCUMENT */}
            <div className="text-center mt-1.5 sm:mt-2">
              <span className="text-[11px] sm:text-[13px] font-medium uppercase tracking-widest text-slate-800">
                LICENCE DE JOUEUR DU TOURNOI
              </span>
            </div>

            {/* NUMÉRO DE LICENCE MAJEUR */}
            <div className="text-center mt-1">
              <span className="text-[17px] sm:text-[21px] font-black tracking-normal text-slate-950 font-mono">
                N° {license.licenseNumber}
              </span>
            </div>
          </div>

          {/* DATES D'ENREGISTREMENT BILATÉRALES */}
          <div className="relative z-10 flex flex-col sm:flex-row justify-between text-[10px] sm:text-[11px] text-slate-600 border-b border-slate-200 pb-1.5 mt-2 px-1 gap-0.5">
            <div>
              Enregistrement Club : <span className="font-semibold text-slate-900">{license.issueDate || '01/11/2026'}</span>
            </div>
            <div>
              Homologation Tournoi : <span className="font-semibold text-slate-900">{license.issueDate || '01/11/2026'}</span>
            </div>
          </div>

          {/* --- CORPS PRINCIPAL DE LA LICENCE --- */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 sm:gap-6 items-center sm:items-start my-auto pt-3 pb-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* PHOTO D'IDENTITÉ JOUEUR (En vraies couleurs naturelles) */}
              <div className="w-[100px] sm:w-[125px] h-[125px] sm:h-[155px] bg-white border-2 border-slate-300 p-0.5 rounded-lg shadow-sm shrink-0 flex flex-col justify-center items-center overflow-hidden">
                {license.photoUrl ? (
                  <img src={license.photoUrl} alt="" className="size-full object-cover rounded-md" />
                ) : (
                  <div className="size-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-center p-2">
                    <div className="size-12 sm:size-16 rounded-full bg-slate-400 text-slate-700 flex items-center justify-center font-bold text-base sm:text-lg mb-1 shadow-inner">
                      {license.lastName.charAt(0)}{license.firstName.charAt(0)}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                      PHOTO OFFICIELLE
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code visible sur mobile à côté de la photo */}
              <div className="sm:hidden ml-auto size-20 bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-sm">
                {license.qrSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: license.qrSvg }} className="size-full flex items-center justify-center" />
                ) : (
                  <div className="text-[8px] text-center font-bold text-slate-500">QR CODE</div>
                )}
              </div>
            </div>

            {/* INFORMATIONS D'ÉTAT CIVIL ALIGNÉES */}
            <div className="w-full flex-1 text-[11.5px] sm:text-[12.5px] leading-tight space-y-1.5 sm:space-y-2 text-slate-800">
              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700">Nom</span>
                <span className="font-black text-slate-950 text-[13.5px] sm:text-[15px] uppercase tracking-wide">
                  {license.lastName}
                </span>
              </div>

              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700">Prénoms</span>
                <span className="font-bold text-slate-950 text-[12.5px] sm:text-[14px]">
                  {license.firstName}
                </span>
              </div>

              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700">Né le</span>
                <span className="font-semibold text-slate-900">
                  {license.birthDate} {license.birthPlace ? `à ${license.birthPlace}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700">Nationalité</span>
                <span className="font-semibold text-slate-900">
                  {license.nationality}
                </span>
              </div>

              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700">Domicile</span>
                <span className="font-normal text-slate-700 truncate">
                  {license.address || 'Adresse homologuée du joueur'}
                </span>
              </div>

              <div className="grid grid-cols-[85px_1fr] sm:grid-cols-[100px_1fr] items-baseline">
                <span className="font-normal text-slate-700 underline decoration-slate-400 underline-offset-2">
                  Observations
                </span>
                <span className="font-normal text-slate-600 text-[11px] sm:text-[11.5px]">
                  {license.observations || `Maillot #${license.jerseyNumber || '—'} / ${license.position || 'Joueur'}`}
                </span>
              </div>
            </div>

            {/* QR CODE (Écrans normaux) */}
            <div className="hidden sm:flex size-20 bg-white border border-slate-300 p-1 items-center justify-center shrink-0 shadow-sm">
              {license.qrSvg ? (
                <div dangerouslySetInnerHTML={{ __html: license.qrSvg }} className="size-full flex items-center justify-center" />
              ) : (
                <div className="text-[8px] text-center font-bold text-slate-500">QR CODE</div>
              )}
            </div>
          </div>

          {/* --- PIED DU DOCUMENT : EXPIRATION ET SIGNATURE --- */}
          <div className="relative z-10 pt-2.5 sm:pt-3 border-t border-slate-200 flex justify-between items-end text-[11px] sm:text-[12px]">
            <div>
              <span className="font-bold text-slate-900">Expiration</span>
              <span className="font-black text-slate-950 text-[12px] sm:text-[13px] ml-2 sm:ml-4 font-mono">
                {license.expirationDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] text-slate-600 italic">Le titulaire,</span>
              <span
                className="text-[15px] sm:text-[18px] text-indigo-900 select-none font-serif italic -rotate-6 tracking-wider"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {license.firstName.charAt(0).toLowerCase()}. {license.lastName.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'actions rapides */}
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-4 print:hidden w-full">
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <Printer size={15} /> Imprimer la licence
        </button>
        {onDownloadPdf && (
          <button
            onClick={onDownloadPdf}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-[#157a38] hover:bg-[#11662e] text-white text-xs font-extrabold transition shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Download size={15} /> Télécharger la licence PDF
          </button>
        )}
      </div>
    </div>
  )
}
