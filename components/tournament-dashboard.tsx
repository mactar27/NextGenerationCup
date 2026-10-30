// components/tournament-dashboard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
  X,
  FileCheck,
  QrCode,
  ShieldAlert,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Shield,
  Award,
  Layers,
  Camera,
  Upload,
  Trash2,
  Edit2,
  Copy,
  Check
} from 'lucide-react'
import { LoginView } from './login-view'
import { LicenseCard, LicenseData } from './license-card'
import { downloadLicenseDocument } from '@/lib/pdf/download-license'

export function TournamentDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(false)

  const [activeTab, setActiveTab] = useState('Tableau de bord')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')

  // State data
  const [stats, setStats] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [standingsData, setStandingsData] = useState<{ standings: any[]; pools: Record<string, any[]> }>({ standings: [], pools: {} })
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Modal Équipe
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    code: '',
    city: '',
    logoUrl: '',
    primaryColor: '#0f3d23',
    secondaryColor: '#f5c000',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    managerUsername: '',
    managerPassword: '',
    poolGroup: 'POULE_A'
  })
  const [teamActionLoading, setTeamActionLoading] = useState(false)
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    teamName: string
    code: string
    username: string
    password: string
    managerName: string
  } | null>(null)

  // Modal Joueur
  const [selectedPlayerLicense, setSelectedPlayerLicense] = useState<LicenseData | null>(null)
  const [selectedPlayerDetail, setSelectedPlayerDetail] = useState<any>(null)
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null)
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  const [newPlayerForm, setNewPlayerForm] = useState({
    teamId: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    nationality: 'Française',
    jerseyNumber: '',
    position: 'ATTAQUANT',
    dominantFoot: 'DROIT',
    address: '',
    photoUrl: '',
    observations: ''
  })
  const [playerActionLoading, setPlayerActionLoading] = useState(false)

  // Modal Match
  const [showAddMatchModal, setShowAddMatchModal] = useState(false)
  const [newMatchForm, setNewMatchForm] = useState({
    homeTeamId: '',
    awayTeamId: '',
    matchDate: new Date().toISOString().split('T')[0],
    matchTime: '15:00',
    venue: 'Terrain Principal',
    phase: 'POULES',
    poolGroup: 'POULE_A'
  })
  const [matchActionLoading, setMatchActionLoading] = useState(false)

  // Modal Score
  const [scoringMatch, setScoringMatch] = useState<any>(null)
  const [scoreForm, setScoreForm] = useState({ homeScore: 0, awayScore: 0, notes: '', status: 'COMPLETED' })
  const [scoreLoading, setScoreLoading] = useState(false)

  // Rejection modal
  const [rejectingPlayerId, setRejectingPlayerId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Modals et États Licences (Ajout / Modification / Suppression)
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false)
  const [editingLicense, setEditingLicense] = useState<any>(null)
  const [newLicenseForm, setNewLicenseForm] = useState({
    playerId: '',
    season: '2026/2027',
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: '2027-06-30',
    status: 'VALIDATED'
  })
  const [licenseActionLoading, setLicenseActionLoading] = useState(false)

  // Moteurs de Recherche Instantanés
  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [playerTeamFilter, setPlayerTeamFilter] = useState('ALL')
  const [playerPositionFilter, setPlayerPositionFilter] = useState('ALL')
  const [matchSearchQuery, setMatchSearchQuery] = useState('')
  const [matchPhaseFilter, setMatchPhaseFilter] = useState('ALL')

  // Check current session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user)
          setCurrentTeam(data.team)
        }
      })
      .catch(() => {
        setCurrentUser(null)
      })
  }, [])

  // Load section data whenever user or activeTab changes
  useEffect(() => {
    if (!currentUser) return

    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err))

    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.teams || []))
      .catch((err) => console.error(err))

    if (activeTab === 'Joueurs' || activeTab === 'Tous les Joueurs' || activeTab === 'Mes Joueurs (Max 30)' || activeTab === 'Licences & QR Codes') {
      fetch('/api/players')
        .then((res) => res.json())
        .then((data) => setPlayers(data.players || []))
        .catch((err) => console.error(err))
    }

    if (activeTab === 'Matchs & Poules' || activeTab === 'Tableau de bord' || activeTab === 'Phase Finale') {
      fetch('/api/matches')
        .then((res) => res.json())
        .then((data) => setMatches(data.matches || []))
        .catch((err) => console.error(err))
    }

    if (activeTab === 'Classement & Poules' || activeTab === 'Tableau de bord') {
      fetch('/api/standings')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.standings)) {
            setStandingsData(data)
          } else {
            setStandingsData({ standings: [], pools: {} })
          }
        })
        .catch((err) => {
          console.error(err)
          setStandingsData({ standings: [], pools: {} })
        })
    }

    if (activeTab === 'Journal d\'activité' && currentUser.role === 'ADMIN') {
      fetch('/api/audit')
        .then((res) => res.json())
        .then((data) => setAuditLogs(data.logs || []))
        .catch((err) => console.error(err))
    }
  }, [currentUser, activeTab])

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    setCurrentTeam(null)
    notify('Déconnexion réussie.')
  }

  // Création d'une nouvelle équipe
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamActionLoading(true)

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de l’équipe.')

      notify('✅ Équipe enregistrée avec succès !')
      setShowAddTeamModal(false)
      setNewTeamForm({
        name: '',
        code: '',
        city: '',
        logoUrl: '',
        primaryColor: '#0f3d23',
        secondaryColor: '#f5c000',
        managerName: '',
        managerEmail: '',
        managerPhone: '',
        managerUsername: '',
        managerPassword: '',
        poolGroup: 'POULE_A'
      })

      const updatedTeams = await fetch('/api/teams').then((r) => r.json())
      setTeams(updatedTeams.teams || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setTeamActionLoading(false)
    }
  }

  // Ajout d'un joueur
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlayerActionLoading(true)

    const teamIdToUse = isManager ? currentUser.teamId : (newPlayerForm.teamId || teams[0]?.id)

    if (!teamIdToUse) {
      notify('⚠️ Veuillez d’abord créer au moins une équipe.')
      setPlayerActionLoading(false)
      return
    }

    if (!newPlayerForm.photoUrl) {
      notify('⚠️ La photo d\'identité est obligatoire pour valider la licence officielle.')
      setPlayerActionLoading(false)
      return
    }

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlayerForm,
          teamId: teamIdToUse
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’inscription.')

      notify(isAdmin ? 'Joueur enregistré avec succès !' : 'Dossier joueur soumis pour validation.')
      setShowAddPlayerModal(false)
      setNewPlayerForm({
        teamId: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        nationality: 'Française',
        jerseyNumber: '',
        position: 'ATTAQUANT',
        dominantFoot: 'DROIT',
        address: '',
        photoUrl: '',
        observations: ''
      })

      const updatedPlayers = await fetch('/api/players').then((r) => r.json())
      setPlayers(updatedPlayers.players || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setPlayerActionLoading(false)
    }
  }

  // Création / Programmation d'un Match
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setMatchActionLoading(true)

    if (newMatchForm.homeTeamId === newMatchForm.awayTeamId) {
      notify('⚠️ L’équipe domicile et l’équipe visiteuse doivent être différentes.')
      setMatchActionLoading(false)
      return
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatchForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la programmation.')

      notify('✅ Rencontre programmée avec succès !')
      setShowAddMatchModal(false)

      const updatedMatches = await fetch('/api/matches').then((r) => r.json())
      setMatches(updatedMatches.matches || [])
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setMatchActionLoading(false)
    }
  }

  // Saisie et validation du score
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoringMatch) return
    setScoreLoading(true)

    try {
      const res = await fetch(`/api/matches/${scoringMatch.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la validation du score.')

      notify('🏆 Score officiel validé ! Le classement a été actualisé.')
      setScoringMatch(null)

      const updatedMatches = await fetch('/api/matches').then((r) => r.json())
      setMatches(updatedMatches.matches || [])
      const updatedStandings = await fetch('/api/standings').then((r) => r.json())
      setStandingsData(updatedStandings)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setScoreLoading(false)
    }
  }

  // Validation / Rejet / Suspension Licence
  const handleValidatePlayer = async (playerId: string, action: 'VALIDATE' | 'REJECT' | 'SUSPEND', reason?: string) => {
    try {
      const res = await fetch(`/api/players/${playerId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action impossible.')

      notify(data.message)
      setRejectingPlayerId(null)
      setRejectionReason('')

      const updated = await fetch('/api/players').then((r) => r.json())
      setPlayers(updated.players || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    }
  }

  // Actions Licences (Ajout direct, Modification, Suppression)
  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLicenseActionLoading(true)
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicenseForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la licence.')

      notify(`Licence ${data.licenseNumber} créée avec succès !`)
      setShowAddLicenseModal(false)
      setNewLicenseForm({
        playerId: '',
        season: '2026/2027',
        issueDate: new Date().toISOString().split('T')[0],
        expirationDate: '2027-06-30',
        status: 'VALIDATED'
      })

      const updated = await fetch('/api/players').then((r) => r.json())
      setPlayers(updated.players || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setLicenseActionLoading(false)
    }
  }

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLicense) return
    setLicenseActionLoading(true)
    try {
      const res = await fetch(`/api/licenses/${editingLicense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season: editingLicense.season,
          issueDate: editingLicense.issue_date,
          expirationDate: editingLicense.expiration_date,
          status: editingLicense.status
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour.')

      notify('Licence officielle modifiée avec succès.')
      setEditingLicense(null)

      const updated = await fetch('/api/players').then((r) => r.json())
      setPlayers(updated.players || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    } finally {
      setLicenseActionLoading(false)
    }
  }

  const handleDeleteLicense = async (licenseId: string, licenseNumber: string) => {
    if (!confirm(`Confirmez-vous la révocation et suppression définitive de la licence ${licenseNumber} ?`)) {
      return
    }
    try {
      const res = await fetch(`/api/licenses/${licenseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.')

      notify(`Licence ${licenseNumber} supprimée.`)
      const updated = await fetch('/api/players').then((r) => r.json())
      setPlayers(updated.players || [])
      const updatedStats = await fetch('/api/dashboard/stats').then((r) => r.json())
      setStats(updatedStats)
    } catch (err: any) {
      notify(`⚠️ ${err.message}`)
    }
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={async (user) => {
          setCurrentUser(user)
          notify(`Bienvenue ${user.fullName} (${user.role})`)
          try {
            const meRes = await fetch('/api/auth/me')
            if (meRes.ok) {
              const meData = await meRes.json()
              if (meData.team) setCurrentTeam(meData.team)
            }
          } catch (e) {
            console.error('Error fetching team on login:', e)
          }
        }}
      />
    )
  }

  const isManager = currentUser.role === 'TEAM_MANAGER'
  const managerTeamName =
    currentTeam?.name ||
    teams.find((t) => t.id === currentUser?.teamId)?.name ||
    (isManager ? currentUser?.fullName : 'Mon Équipe')
  const isAdmin = currentUser.role === 'ADMIN'
  const isOfficial = currentUser.role === 'OFFICIAL'

  const menuItems = [
    { label: 'Tableau de bord', icon: Home },
    { label: 'Équipes', icon: Trophy },
    { label: 'Joueurs', icon: Users },
    { label: 'Licences & QR Codes', icon: FileCheck },
    { label: 'Matchs & Poules', icon: CalendarDays },
    { label: 'Classement', icon: ClipboardList },
    { label: 'Phase Finale', icon: Award }
  ]

  const phaseOptions = [
    { value: 'POULES', label: 'Phase de Poules' },
    { value: 'QUARTS', label: 'Quarts de Finale' },
    { value: 'DEMIS', label: 'Demi-Finales' },
    { value: 'PETITE_FINALE', label: 'Match 3e Place' },
    { value: 'FINALE', label: 'GRANDE FINALE' }
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800 flex flex-col">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#072418] text-slate-300 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Sidebar Brand (Cliquable) */}
        <button
          onClick={() => {
            setActiveTab('Tableau de bord')
            setMobileOpen(false)
          }}
          className="flex h-[82px] items-center gap-3 border-b border-emerald-900/40 px-5 text-white w-full text-left hover:bg-white/5 transition cursor-pointer"
          title="Aller au Tableau de bord"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm shrink-0">
            <img
              src="/logo-next-gen-cup.jpg"
              alt="Next Generation Cup"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-black tracking-wider text-[#f5c000] block uppercase leading-tight">
              TERANGA AGENCY
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight mt-0.5">
              NEXT GENERATION CUP 2026
            </span>
          </div>
          <div className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setMobileOpen(false); }}>
            <X size={19} />
          </div>
        </button>

        {/* Badge Administrateur Principal */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2.5">
          <div className="size-6 rounded-lg bg-[#157a38] text-white flex items-center justify-center shrink-0 font-black text-[10px]">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-white font-bold truncate">
              {currentUser.fullName || 'Administrateur'}
            </div>
            <div className="text-[9px] text-emerald-400 font-medium">
              Gestionnaire Unique
            </div>
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {menuItems.map(({ label, icon: Icon }) => {
            const isActive = activeTab === label
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveTab(label)
                  setMobileOpen(false)
                }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#157a38] text-white shadow-sm font-semibold'
                    : 'text-slate-300/90 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400'} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer Sidebar avec drapeau Sénégal & Teranga Agency */}
        <div className="mt-auto border-t border-emerald-900/40 p-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="text-xl">🇸🇳</div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                TERANGA AGENCY
              </div>
              <div className="text-[9px] text-emerald-400/90 font-medium">
                Sport • Formation • Développement
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-900/30 text-center">
            <a
              href="https://www.wockytech.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-emerald-300 transition block font-medium"
            >
              Réalisé par <span className="font-bold text-white hover:underline">WockyTech</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-[260px] flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
          <button className="text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={22} />
          </button>

          {/* Selecteur / Badge Compétition avec Logo Lion (Cliquable) */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setActiveTab('Tableau de bord')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/60 hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer group"
              title="Retour au Tableau de bord — Next Generation Cup 2026"
            >
              <img
                src="/logo-teranga-agency.jpg"
                alt="Lion"
                className="size-5 rounded-full object-cover group-hover:scale-105 transition"
              />
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#157a38] transition">
                Next Generation Cup 2026
              </span>
              <ChevronDown size={14} className="text-slate-400 ml-1 group-hover:text-[#157a38] transition" />
            </button>
          </div>

          {/* Profil & Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => notify('Statistiques et classements synchronisés.')}
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs">
                {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900">{currentUser.fullName || 'Administrateur'}</div>
                <div className="text-[11px] text-slate-500 capitalize">{currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Déconnexion"
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 mx-auto max-w-[1250px] w-full px-3.5 sm:px-8 py-4 sm:py-6">
          {/* TAB 1: Tableau de bord */}
          {activeTab === 'Tableau de bord' && (
            <div className="space-y-4 sm:space-y-6">
              {/* En-tête avec titre et 2 boutons d'action verts maquette */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Tableau de bord
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                    Vue d'ensemble de la compétition et de l'activité du tournoi.
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowAddMatchModal(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <CalendarDays className="size-3.5 sm:size-4" /> Match
                  </button>
                  <button
                    onClick={() => setShowAddTeamModal(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="size-3.5 sm:size-4" /> Équipe
                  </button>
                </div>
              </div>

              {/* Statistics Cards compactes & ergonomiques (Grille 2x2 sur mobile au lieu de 1x4 géant) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                {/* Clubs engagés */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="size-8 sm:size-10 rounded-xl bg-emerald-50 text-[#157a38] flex items-center justify-center font-bold">
                      <Trophy className="size-4 sm:size-5" />
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 sm:px-2 py-0.5 rounded-full">
                      +2 sem.
                    </span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Clubs engagés</div>
                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {teams.length || 13}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">/ 21</span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 h-1 sm:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#157a38] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(((teams.length || 13) / 21) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Joueurs enregistrés */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="size-8 sm:size-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Users className="size-4 sm:size-5" />
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 sm:px-2 py-0.5 rounded-full">
                      +14 J-1
                    </span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Joueurs inscrits</div>
                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {stats?.stats?.registeredPlayers || players.length || 25}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">/ 630</span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 h-1 sm:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((((stats?.stats?.registeredPlayers || players.length || 25)) / 630) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Matchs programmés */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="size-8 sm:size-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <CalendarDays className="size-4 sm:size-5" />
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                      Poules
                    </span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Matchs prévus</div>
                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {matches.length || 19}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-600">3 joués</span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 h-1 sm:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: '45%' }}
                    />
                  </div>
                </div>

                {/* Licences actives */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="size-8 sm:size-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      <QrCode className="size-4 sm:size-5" />
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <CheckCircle2 className="size-3" /> 94%
                    </span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Licences actives</div>
                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {stats?.stats?.validatedLicenses || players.filter((p) => p.status === 'VALIDATED').length || 25}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">Valides</span>
                  </div>
                  <div className="mt-2.5 sm:mt-3.5 h-1 sm:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#157a38] rounded-full transition-all duration-500"
                      style={{ width: '94%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Ligne : Prochain Match & Classement selon la maquette */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Prochain Match Card Réinventée & Professionnelle */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Prochain grand choc</h2>
                          <span className="text-[11px] text-slate-500 font-medium">Poule A • 2ème Journée</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('Matchs & Poules')}
                        className="text-xs font-bold text-[#157a38] hover:underline cursor-pointer flex items-center gap-1 group"
                      >
                        Calendrier complet <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center my-2">
                      {/* Présentation compacte des 2 Équipes avec Vrais Logos */}
                      <div className="md:col-span-7 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/80 shadow-xs">
                        {/* Équipe Domicile */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-0 pr-2">
                          <div className="size-14 rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center hover:scale-105 transition">
                            <img
                              src="/clubs/asc-ndiambour.svg"
                              alt="ASC Ndiambour"
                              className="size-full object-contain"
                            />
                          </div>
                          <span className="text-[13px] font-black text-slate-950 block mt-2 tracking-tight leading-snug truncate max-w-full">
                            ASC Ndiambour
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Louga • Domicile
                          </span>
                        </div>

                        {/* Séparateur VS compact */}
                        <div className="flex flex-col items-center justify-center px-2">
                          <span className="px-2 py-1 rounded-md bg-slate-900 text-amber-400 font-black text-[10px] tracking-wider shadow-xs">
                            VS
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                            J-2
                          </span>
                        </div>

                        {/* Équipe Extérieur */}
                        <div className="flex flex-col items-center text-center flex-1 min-w-0 pl-2">
                          <div className="size-14 rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center hover:scale-105 transition">
                            <img
                              src="/clubs/generation-foot.svg"
                              alt="Génération Foot"
                              className="size-full object-contain"
                            />
                          </div>
                          <span className="text-[13px] font-black text-slate-950 block mt-2 tracking-tight leading-snug truncate max-w-full">
                            Génération Foot
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Dakar • Extérieur
                          </span>
                        </div>
                      </div>

                      {/* Terrain de Football Texturé avec Relief & Lignes discrètes */}
                      <div className="md:col-span-5 relative h-28 rounded-2xl overflow-hidden border border-emerald-900/30 shadow-inner flex items-center justify-center"
                        style={{
                          background: 'repeating-linear-gradient(90deg, #1b5e20 0px, #1b5e20 18px, #2e7d32 18px, #2e7d32 36px)'
                        }}
                      >
                        {/* Pelouse / Éclairage & Ombrage */}
                        <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-black/25 pointer-events-none" />
                        
                        {/* Ligne médiane & Rond central */}
                        <div className="absolute inset-y-0 left-1/2 w-[1.5px] bg-white/70" />
                        <div className="size-12 rounded-full border-[1.5px] border-white/70 flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-white/80" />
                        </div>
                        
                        {/* Surfaces de réparation */}
                        <div className="absolute inset-y-3 left-0 w-8 border-y-[1.5px] border-r-[1.5px] border-white/70 bg-white/5" />
                        <div className="absolute inset-y-3 right-0 w-8 border-y-[1.5px] border-l-[1.5px] border-white/70 bg-white/5" />

                        {/* Badge officiel du Stade / Terrain */}
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[9px] font-extrabold text-white tracking-wider flex items-center gap-1.5 shadow-sm border border-white/20">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>STADE MUNICIPAL DE DAKAR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations de coup d'envoi & stade */}
                  <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <CalendarDays size={14} className="text-[#157a38]" /> Samedi 15 mars 2026
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Clock3 size={14} className="text-slate-400" /> 16:00 UTC
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Trophy size={14} className="text-slate-400" /> Stade municipal de Dakar
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Entrée libre
                    </span>
                  </div>
                </div>

                {/* Classement Rapide Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900">Classement</h2>
                    <button
                      onClick={() => setActiveTab('Classement & Poules')}
                      className="text-xs font-bold text-[#157a38] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Voir complet <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100">
                      <span className="col-span-1">#</span>
                      <span className="col-span-7">Équipe</span>
                      <span className="col-span-2 text-right">Pts</span>
                      <span className="col-span-2 text-right">J</span>
                    </div>

                    {(standingsData.standings && standingsData.standings.length > 0
                      ? standingsData.standings.slice(0, 6)
                      : [
                          { rank: 1, name: 'Génération Foot', pts: 15, j: 6, color: '#9e1b32', code: 'GF', logo: '/clubs/generation-foot.svg' },
                          { rank: 2, name: 'ASC Ndiambour', pts: 12, j: 6, color: '#183b63', code: 'ASCN', logo: '/clubs/asc-ndiambour.svg' },
                          { rank: 3, name: 'Casa Sports', pts: 10, j: 6, color: '#157a38', code: 'CS', logo: '/clubs/casa-sports.svg' },
                          { rank: 4, name: 'Dakar Sacré-Cœur', pts: 9, j: 6, color: '#c8102e', code: 'DSC', logo: '/clubs/dakar-sacre-coeur.svg' },
                          { rank: 5, name: 'US Gorée', pts: 8, j: 6, color: '#004170', code: 'USG', logo: '/clubs/us-goree.svg' },
                          { rank: 6, name: 'Jaraaf', pts: 6, j: 6, color: '#0f3d23', code: 'JAR', logo: '/clubs/jaraaf.svg' }
                        ]
                    ).map((s: any, idx: number) => {
                      const logoSrc = s.logo || s.logo_url || s.logoUrl || (
                        s.code === 'GF' || s.teamCode === 'GF' ? '/clubs/generation-foot.svg' :
                        s.code === 'ASCN' || s.teamCode === 'ASCN' ? '/clubs/asc-ndiambour.svg' :
                        s.code === 'CS' || s.teamCode === 'CS' ? '/clubs/casa-sports.svg' :
                        s.code === 'DSC' || s.teamCode === 'DSC' ? '/clubs/dakar-sacre-coeur.svg' :
                        s.code === 'USG' || s.teamCode === 'USG' ? '/clubs/us-goree.svg' :
                        s.code === 'JAR' || s.teamCode === 'JAR' ? '/clubs/jaraaf.svg' : null
                      )
                      return (
                        <div key={s.teamId || s.name} className="grid grid-cols-12 items-center text-xs py-1">
                          <span className="col-span-1 font-bold text-slate-600">{idx + 1}</span>
                          <div className="col-span-7 flex items-center gap-2 min-w-0 pr-2">
                            {logoSrc ? (
                              <img src={logoSrc} alt="" className="size-5 object-contain shrink-0" />
                            ) : (
                              <span
                                className="size-5 rounded-md flex items-center justify-center text-[10px] text-white font-black shrink-0"
                                style={{ backgroundColor: s.color || '#157a38' }}
                              >
                                {(s.teamCode || s.code || s.name).substring(0, 2)}
                              </span>
                            )}
                            <span className="font-semibold text-slate-800 truncate">{s.teamName || s.name}</span>
                          </div>
                          <span className="col-span-2 text-right font-black text-slate-900">{s.points ?? s.pts}</span>
                          <span className="col-span-2 text-right text-slate-500">{s.played ?? s.j}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tableau Prochains Matchs selon la maquette */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Prochains matchs</h2>
                  <button
                    onClick={() => setActiveTab('Matchs & Poules')}
                    className="text-xs font-bold text-[#157a38] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Voir tout <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                        <th className="pb-3 font-bold">Date & heure</th>
                        <th className="pb-3 font-bold">Équipe domicile</th>
                        <th className="pb-3 text-center font-bold">vs</th>
                        <th className="pb-3 font-bold">Équipe extérieure</th>
                        <th className="pb-3 text-center font-bold">Poule</th>
                        <th className="pb-3 text-right font-bold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 text-slate-600 font-medium">Sam. 15 mars 2026 - 16:00</td>
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img src="/clubs/asc-ndiambour.svg" alt="ASCN" className="size-6 object-contain" />
                            <span>ASC Ndiambour</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center text-slate-400 font-bold">VS</td>
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img src="/clubs/generation-foot.svg" alt="GF" className="size-6 object-contain" />
                            <span>Génération Foot</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center text-slate-600 font-semibold">A</td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            À venir
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 text-slate-600 font-medium">Dim. 16 mars 2026 - 16:00</td>
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img src="/clubs/casa-sports.svg" alt="CS" className="size-6 object-contain" />
                            <span>Casa Sports</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center text-slate-400 font-bold">VS</td>
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img src="/clubs/dakar-sacre-coeur.svg" alt="DSC" className="size-6 object-contain" />
                            <span>Dakar Sacré-Cœur</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center text-slate-600 font-semibold">A</td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            À venir
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Matchs & Poules */}
          {activeTab === 'Matchs & Poules' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-[#172033] tracking-tight">Matchs & Gestion des Scores</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Programmez les rencontres, saisissez les scores en direct et validez les résultats officiels.
                  </p>
                </div>

                {(isAdmin || isOfficial) && (
                  <button
                    onClick={() => setShowAddMatchModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow cursor-pointer"
                  >
                    <Plus size={16} /> Programmer un Match
                  </button>
                )}
              </div>

              {/* Barre de Recherche et Filtres Matchs */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={matchSearchQuery}
                    onChange={(e) => setMatchSearchQuery(e.target.value)}
                    placeholder="Rechercher un match (ex: Casa Sports, Génération Foot, Dakar...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#157a38] focus:ring-2 focus:ring-[#157a38]/20 transition shadow-sm"
                  />
                  {matchSearchQuery && (
                    <button
                      onClick={() => setMatchSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={matchPhaseFilter}
                  onChange={(e) => setMatchPhaseFilter(e.target.value)}
                  className="w-full sm:w-auto p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#157a38]"
                >
                  <option value="ALL">Toutes les phases</option>
                  <option value="JOURNEE">Matchs de Poules</option>
                  <option value="QUARTS">Quarts de Finale</option>
                  <option value="DEMIS">Demi-Finales</option>
                  <option value="FINALE">Grande Finale</option>
                </select>

                <div className="text-xs text-slate-500 font-medium sm:ml-auto">
                  {matches.filter((m) => {
                    const matchesSearch = matchSearchQuery
                      ? (m.home_team_name && m.home_team_name.toLowerCase().includes(matchSearchQuery.toLowerCase())) ||
                        (m.away_team_name && m.away_team_name.toLowerCase().includes(matchSearchQuery.toLowerCase())) ||
                        (m.venue && m.venue.toLowerCase().includes(matchSearchQuery.toLowerCase()))
                      : true
                    const matchesPhase = matchPhaseFilter === 'ALL' || (m.phase && m.phase.includes(matchPhaseFilter))
                    return matchesSearch && matchesPhase
                  }).length} match(s) trouvé(s)
                </div>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
                  <CalendarDays size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Aucun match programmé</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Sélectionnez deux équipes parmi vos clubs inscrits pour programmer une rencontre.
                  </p>
                  {(isAdmin || isOfficial) && (
                    <button
                      onClick={() => setShowAddMatchModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus size={15} /> Programmer le Premier Match
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches
                    .filter((m) => {
                      const matchesSearch = matchSearchQuery
                        ? (m.home_team_name && m.home_team_name.toLowerCase().includes(matchSearchQuery.toLowerCase())) ||
                          (m.away_team_name && m.away_team_name.toLowerCase().includes(matchSearchQuery.toLowerCase())) ||
                          (m.venue && m.venue.toLowerCase().includes(matchSearchQuery.toLowerCase()))
                        : true
                      const matchesPhase = matchPhaseFilter === 'ALL' || (m.phase && m.phase.includes(matchPhaseFilter))
                      return matchesSearch && matchesPhase
                    })
                    .map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {m.phase} {m.pool_group ? `• ${m.pool_group}` : ''}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {m.status === 'COMPLETED' ? 'Terminé' : 'Programmé'}
                          </span>
                        </div>

                        <div className="my-4 flex items-center justify-between">
                          <div className="text-center flex-1">
                            <div className="font-extrabold text-sm text-slate-900">{m.home_team_name}</div>
                            <div className="text-xs text-slate-400 font-semibold">{m.home_team_code}</div>
                          </div>

                          <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono font-black text-lg mx-2">
                            {m.status === 'COMPLETED' ? `${m.home_score} - ${m.away_score}` : 'vs'}
                          </div>

                          <div className="text-center flex-1">
                            <div className="font-extrabold text-sm text-slate-900">{m.away_team_name}</div>
                            <div className="text-xs text-slate-400 font-semibold">{m.away_team_code}</div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                          <div>📅 {m.match_date} à {m.match_time}</div>
                          <div>📍 {m.venue}</div>
                          {m.official_notes && <div className="text-slate-400 italic mt-1">« {m.official_notes} »</div>}
                        </div>
                      </div>

                      {(isAdmin || isOfficial) && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setScoringMatch(m)
                              setScoreForm({
                                homeScore: m.home_score || 0,
                                awayScore: m.away_score || 0,
                                notes: m.official_notes || '',
                                status: m.status || 'COMPLETED'
                              })
                            }}
                            className="w-full py-2 rounded-lg bg-[#157a38] hover:bg-[#11662e] text-white font-bold text-xs transition cursor-pointer shadow-sm text-center"
                          >
                            ✏️ Saisir / Valider le Score
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Classement & Poules */}
          {(activeTab === 'Classement' || activeTab === 'Classement & Poules') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-[#172033] tracking-tight">Classement Officiel du Tournoi</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Mise à jour automatique : Victoire = 3 pts, Nul = 1 pt, Défaite = 0 pt. Départage par Différence de Buts et Buts Marqués.
                </p>
              </div>

              {/* Classement Général */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList size={16} /> Classement Général Toutes Poules
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Club</th>
                        <th className="py-3 px-3 text-center">Poule</th>
                        <th className="py-3 px-3 text-center">J</th>
                        <th className="py-3 px-3 text-center">G</th>
                        <th className="py-3 px-3 text-center">N</th>
                        <th className="py-3 px-3 text-center">P</th>
                        <th className="py-3 px-3 text-center">BP</th>
                        <th className="py-3 px-3 text-center">BC</th>
                        <th className="py-3 px-3 text-center">DIFF</th>
                        <th className="py-3 px-4 text-center font-black">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!standingsData?.standings || standingsData.standings.length === 0) ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400">
                            Aucune équipe dans le classement.
                          </td>
                        </tr>
                      ) : (
                        standingsData.standings.map((s, idx) => (
                          <tr key={s.teamId} className={`hover:bg-slate-50 ${idx < 4 ? 'bg-amber-50/20' : ''}`}>
                            <td className="py-3 px-4 font-black text-slate-800">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{s.teamName}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                                {s.poolGroup}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">{s.played}</td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">{s.won}</td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">{s.drawn}</td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-600">{s.lost}</td>
                            <td className="py-3 px-3 text-center text-slate-500">{s.goalsFor}</td>
                            <td className="py-3 px-3 text-center text-slate-500">{s.goalsAgainst}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                              {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                            </td>
                            <td className="py-3 px-4 text-center font-black text-sm text-[#0f3d23]">{s.points}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Phase Finale & Arbre (Schéma Tableau de Tournoi) */}
          {(activeTab === 'Phase Finale' || activeTab === 'Phase Finale & Arbre') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Schéma de la Phase Finale
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Tableau officiel à élimination directe : Quarts de Finale ➔ Demi-Finales ➔ Grande Finale & Titre.
                  </p>
                </div>

                {(isAdmin || isOfficial) && (
                  <button
                    onClick={() => {
                      setNewMatchForm({ ...newMatchForm, phase: 'FINALE' })
                      setShowAddMatchModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus size={16} /> Programmer un match de phase finale
                  </button>
                )}
              </div>

              {/* Schéma de Tournoi Interactif (Bracket Professionnel) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-x-auto">
                <div className="min-w-[900px] py-4">
                  {/* En-têtes des étapes */}
                  <div className="grid grid-cols-3 gap-8 mb-6 text-center">
                    <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2">
                        <Layers size={14} className="text-[#157a38]" /> 1/4 de Finale
                      </span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2">
                        <Layers size={14} className="text-[#157a38]" /> 1/2 Finales
                      </span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-amber-50/80 border border-amber-200">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-2">
                        <Trophy size={14} className="text-[#f5c000]" /> Grande Finale
                      </span>
                    </div>
                  </div>

                  {/* Arbre / Bracket Grid avec connecteurs */}
                  <div className="grid grid-cols-3 gap-8 items-center relative">
                    {/* Colonne 1: Quarts de Finale (4 matchs) */}
                    <div className="space-y-6">
                      {(matches.filter((m) => m.phase === 'QUARTS').length > 0
                        ? matches.filter((m) => m.phase === 'QUARTS')
                        : [
                            { id: 'q1', home_team_name: 'Génération Foot', away_team_name: 'US Gorée', home_score: 3, away_score: 1, status: 'COMPLETED' },
                            { id: 'q2', home_team_name: 'ASC Ndiambour', away_team_name: 'Jaraaf', home_score: 2, away_score: 1, status: 'COMPLETED' },
                            { id: 'q3', home_team_name: 'Casa Sports', away_team_name: 'Teungueth FC', home_score: 1, away_score: 0, status: 'COMPLETED' },
                            { id: 'q4', home_team_name: 'Dakar Sacré-Cœur', away_team_name: 'AS Douanes', home_score: 2, away_score: 0, status: 'COMPLETED' }
                          ]
                      ).map((m: any, idx: number) => {
                        const isFinished = m.status === 'COMPLETED'
                        const homeWon = isFinished && Number(m.home_score) > Number(m.away_score)
                        const awayWon = isFinished && Number(m.away_score) > Number(m.home_score)

                        return (
                          <div
                            key={m.id || idx}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 shadow-xs hover:border-[#157a38] transition relative"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1.5 uppercase">
                              <span>Match Q{idx + 1}</span>
                              <span className={isFinished ? 'text-emerald-700' : 'text-amber-600'}>
                                {isFinished ? 'Terminé' : 'À jouer'}
                              </span>
                            </div>

                            {/* Équipe Domicile */}
                            <div className={`flex items-center justify-between p-2 rounded-xl mb-1 transition ${
                              homeWon ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' : 'bg-white text-slate-800'
                            }`}>
                              <span className="text-xs truncate max-w-[170px]">{m.home_team_name}</span>
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100">
                                {isFinished ? m.home_score : '-'}
                              </span>
                            </div>

                            {/* Équipe Extérieure */}
                            <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                              awayWon ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' : 'bg-white text-slate-800'
                            }`}>
                              <span className="text-xs truncate max-w-[170px]">{m.away_team_name}</span>
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100">
                                {isFinished ? m.away_score : '-'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Colonne 2: Demi-Finales (2 matchs centrés verticalement) */}
                    <div className="space-y-16 flex flex-col justify-around h-full py-4">
                      {(matches.filter((m) => m.phase === 'DEMIS').length > 0
                        ? matches.filter((m) => m.phase === 'DEMIS')
                        : [
                            { id: 'd1', home_team_name: 'Génération Foot', away_team_name: 'Casa Sports', home_score: 2, away_score: 1, status: 'COMPLETED' },
                            { id: 'd2', home_team_name: 'ASC Ndiambour', away_team_name: 'Dakar Sacré-Cœur', home_score: 1, away_score: 0, status: 'COMPLETED' }
                          ]
                      ).map((m: any, idx: number) => {
                        const isFinished = m.status === 'COMPLETED'
                        const homeWon = isFinished && Number(m.home_score) > Number(m.away_score)
                        const awayWon = isFinished && Number(m.away_score) > Number(m.home_score)

                        return (
                          <div
                            key={m.id || idx}
                            className="rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/20 p-3.5 shadow-sm relative hover:border-[#157a38] transition"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-2 uppercase">
                              <span className="text-[#157a38]">Demi-Finale {idx + 1}</span>
                              <span className={isFinished ? 'text-emerald-700 font-bold' : 'text-amber-600'}>
                                {isFinished ? 'Qualifié ➔' : 'À venir'}
                              </span>
                            </div>

                            <div className={`flex items-center justify-between p-2.5 rounded-xl mb-1.5 transition ${
                              homeWon ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-white text-slate-800'
                            }`}>
                              <span className="text-xs truncate max-w-[170px]">{m.home_team_name}</span>
                              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${homeWon ? 'bg-emerald-800 text-white' : 'bg-slate-100'}`}>
                                {isFinished ? m.home_score : '-'}
                              </span>
                            </div>

                            <div className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                              awayWon ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-white text-slate-800'
                            }`}>
                              <span className="text-xs truncate max-w-[170px]">{m.away_team_name}</span>
                              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${awayWon ? 'bg-emerald-800 text-white' : 'bg-slate-100'}`}>
                                {isFinished ? m.away_score : '-'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Colonne 3: Grande Finale & Trophée */}
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-full rounded-3xl border-2 border-[#f5c000] bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 p-6 shadow-xl text-center relative overflow-hidden">
                        {/* Motif brillance */}
                        <div className="size-20 rounded-full bg-[#f5c000]/15 flex items-center justify-center mx-auto mb-3 shadow-inner">
                          <Trophy size={40} className="text-[#f5c000]" />
                        </div>

                        <div className="text-[11px] font-black uppercase tracking-widest text-amber-900 mb-1">
                          MATCH DU TITRE 2026
                        </div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                          Grande Finale
                        </h2>
                        <p className="text-[10px] text-slate-500 mb-5">Stade Léopold Sédar Senghor • Dakar</p>

                        {/* Match Finale */}
                        {(() => {
                          const fn = matches.find((m) => m.phase === 'FINALE') || {
                            home_team_name: 'Génération Foot',
                            away_team_name: 'ASC Ndiambour',
                            home_score: 0,
                            away_score: 0,
                            status: 'SCHEDULED'
                          }
                          const isFinished = fn.status === 'COMPLETED'
                          return (
                            <div className="space-y-2 text-left">
                              <div className="p-3 rounded-2xl bg-white border border-amber-200/90 flex items-center justify-between shadow-xs">
                                <span className="font-extrabold text-xs text-slate-900 truncate">{fn.home_team_name}</span>
                                <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400">
                                  {isFinished ? fn.home_score : 'VS'}
                                </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-white border border-amber-200/90 flex items-center justify-between shadow-xs">
                                <span className="font-extrabold text-xs text-slate-900 truncate">{fn.away_team_name}</span>
                                <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400">
                                  {isFinished ? fn.away_score : 'VS'}
                                </span>
                              </div>

                              <div className="mt-4 pt-4 border-t border-amber-200/60 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#157a38] text-white text-[11px] font-bold shadow-sm">
                                  🏆 Vainqueur Next Generation Cup
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Équipes (21 max) */}
          {(activeTab === 'Équipes' || activeTab === 'Équipes (21 max)' || activeTab === 'Mon équipe (Isolation)') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isManager ? `Espace Réservé : ${managerTeamName}` : `Équipes Officielles (${teams.length} / 21)`}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {isManager
                      ? 'Cloisonnement strict : Les autres équipes sont inaccessibles par vos identifiants.'
                      : 'Gestion des 21 clubs engagés dans la Next Generation Cup avec affectation des dirigeants et suivi des effectifs.'}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setShowAddTeamModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus size={16} /> Ajouter une Équipe
                  </button>
                )}
              </div>

              {/* Barre de Recherche Équipes */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="Rechercher une équipe par nom, ville, code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#157a38] focus:ring-2 focus:ring-[#157a38]/20 transition shadow-sm"
                  />
                  {teamSearchQuery && (
                    <button
                      onClick={() => setTeamSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium ml-auto">
                  {teams.filter((t) =>
                    teamSearchQuery
                      ? t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                        t.code.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                        (t.city && t.city.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                      : true
                  ).length} équipe(s) trouvée(s)
                </div>
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
                  <Trophy size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Aucune équipe pour le moment</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Vous pouvez enregistrer jusqu'à 21 équipes officielles. Chaque équipe pourra ensuite accueillir jusqu'à 30 joueurs.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddTeamModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#157a38] text-white text-xs font-bold hover:bg-[#0f602b] transition cursor-pointer"
                    >
                      <Plus size={16} /> Créer la première Équipe
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {teams
                    .filter((t) =>
                      teamSearchQuery
                        ? t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                          t.code.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                          (t.city && t.city.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                        : true
                    )
                    .map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition flex flex-col justify-between group"
                    >
                      <div>
                        {/* En-tête de carte avec blason club et poule */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="size-12 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 border border-black/10"
                              style={{ backgroundColor: t.primary_color || '#157a38' }}
                            >
                              {t.code}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#157a38] transition">
                                {t.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {t.city || 'Sénégal'}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                            {t.pool_group || 'Poule A'}
                          </span>
                        </div>

                        {/* Informations dirigeant & effectif */}
                        <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                              Dirigeant
                            </span>
                            <span className="font-semibold text-slate-700 truncate block mt-0.5">
                              {t.manager_name || 'Non assigné'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                              Effectif
                            </span>
                            <span className="font-black text-slate-900 block mt-0.5">
                              {players.filter((p) => p.team_id === t.id).length || t.player_count || 0}{' '}
                              <span className="text-slate-400 font-semibold text-[10px]">/ 30</span>
                            </span>
                          </div>
                        </div>

                        {/* Barre de progression des 30 joueurs max */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#157a38] h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (((players.filter((p) => p.team_id === t.id).length || t.player_count || 0) / 30) * 100)
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bouton pour filtrer et consulter l'effectif */}
                      <div className="mt-5 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setPlayerTeamFilter(t.id)
                            setActiveTab(isManager ? 'Mes Joueurs (Max 30)' : 'Tous les Joueurs')
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-[#157a38] text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200/80 hover:border-emerald-300 flex items-center justify-center gap-1.5"
                        >
                          <Users size={14} /> Consulter l'effectif
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Tous les Joueurs */}
          {(activeTab === 'Joueurs' || activeTab === 'Tous les Joueurs' || activeTab === 'Mes Joueurs (Max 30)') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-[#172033] tracking-tight">
                    {isManager ? `Effectif de l'équipe (${players.length} / 30 joueurs)` : `Effectif Global du Tournoi (${players.length} / 630)`}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Contrôle automatique des doublons, respect des 30 joueurs et délivrance des licences officielles.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#157a38] hover:bg-[#11662e] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <Plus size={16} /> Ajouter un joueur
                </button>
              </div>

              {/* Barre de Recherche et Filtres Joueurs */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, prénom, numéro de maillot..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#157a38] focus:ring-2 focus:ring-[#157a38]/20 transition shadow-sm"
                  />
                  {playerSearchQuery && (
                    <button
                      onClick={() => setPlayerSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {!isManager && (
                  <select
                    value={playerTeamFilter}
                    onChange={(e) => setPlayerTeamFilter(e.target.value)}
                    className="w-full md:w-auto p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#157a38]"
                  >
                    <option value="ALL">Toutes les équipes</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}

                <select
                  value={playerPositionFilter}
                  onChange={(e) => setPlayerPositionFilter(e.target.value)}
                  className="w-full md:w-auto p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#157a38]"
                >
                  <option value="ALL">Tous les postes</option>
                  <option value="GARDIEN">Gardiens</option>
                  <option value="DEFENSEUR">Défenseurs</option>
                  <option value="MILIEU">Milieux</option>
                  <option value="ATTAQUANT">Attaquants</option>
                </select>

                <div className="text-xs text-slate-500 font-medium md:ml-auto">
                  {players
                    .filter((p) => {
                      const matchesSearch = playerSearchQuery
                        ? p.first_name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                          p.last_name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                          String(p.jersey_number).includes(playerSearchQuery) ||
                          (p.license_number && p.license_number.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                        : true
                      const matchesTeam = playerTeamFilter === 'ALL' || p.team_id === playerTeamFilter
                      const matchesPos = playerPositionFilter === 'ALL' || p.position === playerPositionFilter
                      return matchesSearch && matchesTeam && matchesPos
                    }).length} joueur(s) affiché(s)
                </div>
              </div>

              {/* Table of players */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Maillot & Joueur</th>
                        <th className="py-3.5 px-4">Équipe</th>
                        <th className="py-3.5 px-4">Poste</th>
                        <th className="py-3.5 px-4">Naissance / Nat.</th>
                        <th className="py-3.5 px-4">Statut Dossier</th>
                        <th className="py-3.5 px-4">Licence</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Aucun joueur inscrit pour le moment.
                          </td>
                        </tr>
                      ) : (
                        players
                          .filter((p) => {
                            const matchesSearch = playerSearchQuery
                              ? p.first_name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                                p.last_name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                                String(p.jersey_number).includes(playerSearchQuery) ||
                                (p.license_number && p.license_number.toLowerCase().includes(playerSearchQuery.toLowerCase()))
                              : true
                            const matchesTeam = playerTeamFilter === 'ALL' || p.team_id === playerTeamFilter
                            const matchesPos = playerPositionFilter === 'ALL' || p.position === playerPositionFilter
                            return matchesSearch && matchesTeam && matchesPos
                          })
                          .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div
                                onClick={() => setSelectedPlayerDetail(p)}
                                className="flex items-center gap-3 cursor-pointer group"
                                title="Cliquer pour voir la fiche détaillée et la photo agrandie"
                              >
                                <div className="size-11 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative group-hover:border-[#157a38] group-hover:scale-105 transition">
                                  {p.photo_url ? (
                                    <img src={p.photo_url} alt="" className="size-full object-cover" />
                                  ) : (
                                    <div className="size-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs">
                                      #{p.jersey_number}
                                    </div>
                                  )}
                                  {p.photo_url && (
                                    <span className="absolute bottom-0 right-0 bg-slate-900/80 text-amber-300 font-bold text-[8px] px-1 rounded-tl">
                                      #{p.jersey_number}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 group-hover:text-[#157a38] transition flex items-center gap-1.5">
                                    <span>{p.last_name} {p.first_name}</span>
                                    <Eye size={13} className="text-slate-400 group-hover:text-[#157a38] opacity-0 group-hover:opacity-100 transition" />
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">Pied: {p.dominant_foot}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{p.team_name}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                                {p.position}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{p.birth_date}</div>
                              <div className="text-[10px] text-slate-400">{p.nationality}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  p.status === 'VALIDATED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : p.status === 'SUBMITTED'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : p.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                ● {p.status}
                              </span>
                              {p.rejection_reason && (
                                <div className="text-[10px] text-rose-500 font-semibold mt-1">
                                  Motif: {p.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {p.license_number ? (
                                <button
                                  onClick={() =>
                                    setSelectedPlayerLicense({
                                      licenseNumber: p.license_number,
                                      firstName: p.first_name,
                                      lastName: p.last_name,
                                      birthDate: p.birth_date,
                                      nationality: p.nationality,
                                      jerseyNumber: p.jersey_number,
                                      position: p.position,
                                      teamName: p.team_name,
                                      teamCode: p.team_code,
                                      teamLogoUrl: p.team_logo_url,
                                      teamColor: p.team_primary_color,
                                      season: '2026/2027',
                                      issueDate: '01/11/2026',
                                      expirationDate: '30/06/2027',
                                      status: p.license_status || 'VALIDATED',
                                      address: p.address,
                                      photoUrl: p.photo_url,
                                      qrSvg: p.qr_svg
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-mono font-bold text-[11px] transition cursor-pointer"
                                >
                                  <QrCode size={13} /> {p.license_number}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">En attente</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedPlayerDetail(p)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                                  title="Détails complets du joueur"
                                >
                                  <Eye size={12} /> Détails
                                </button>
                                {isAdmin && p.status !== 'VALIDATED' && (
                                  <button
                                    onClick={() => handleValidatePlayer(p.id, 'VALIDATE')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                                  >
                                    Valider
                                  </button>
                                )}
                                {isAdmin && p.status === 'SUBMITTED' && (
                                  <button
                                    onClick={() => setRejectingPlayerId(p.id)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer"
                                  >
                                    Rejeter
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Licences */}
          {activeTab === 'Licences & QR Codes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Licences Numériques Officielles
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Format officiel ligue professionnelle avec QR code dynamique certifié.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setShowAddLicenseModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus size={16} /> Émettre une nouvelle licence
                  </button>
                )}
              </div>

              {players.filter((p) => p.license_number).length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
                  <FileCheck size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Aucune licence émise pour le moment</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Les licences officielles sont générées automatiquement lors de la validation des dossiers joueurs ou peuvent être créées manuellement.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddLicenseModal(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#157a38] text-white text-xs font-bold hover:bg-[#0f602b] transition cursor-pointer"
                    >
                      <Plus size={15} /> Émettre la première licence
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {players
                    .filter((p) => p.license_number)
                    .map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center relative">
                        {/* Barre d'administration de la licence (Modifier / Supprimer) */}
                        {isAdmin && (
                          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-3 px-1">
                            <span className="text-[11px] font-bold text-slate-500">
                              Gestion Administrative
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setEditingLicense({
                                    id: `lic_${p.id}`,
                                    license_number: p.license_number,
                                    playerName: `${p.last_name} ${p.first_name}`,
                                    season: '2026/2027',
                                    issue_date: '2026-01-15',
                                    expiration_date: '2027-06-30',
                                    status: p.license_status || p.status || 'VALIDATED'
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              >
                                <Edit2 size={13} /> Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteLicense(`lic_${p.id}`, p.license_number)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer border border-rose-200"
                              >
                                <Trash2 size={13} /> Supprimer
                              </button>
                            </div>
                          </div>
                        )}

                        <LicenseCard
                          license={{
                            licenseNumber: p.license_number,
                            firstName: p.first_name,
                            lastName: p.last_name,
                            birthDate: p.birth_date,
                            nationality: p.nationality,
                            jerseyNumber: p.jersey_number,
                            position: p.position,
                            teamName: p.team_name,
                            teamCode: p.team_code,
                            teamLogoUrl: p.team_logo_url,
                            teamColor: p.team_primary_color,
                            season: '2026/2027',
                            issueDate: '01/11/2026',
                            expirationDate: '30/06/2027',
                            status: p.license_status || 'VALIDATED',
                            address: p.address,
                            photoUrl: p.photo_url,
                            qrSvg: p.qr_svg
                          }}
                          onDownloadPdf={() =>
                            downloadLicenseDocument({
                              licenseNumber: p.license_number,
                              firstName: p.first_name,
                              lastName: p.last_name,
                              birthDate: p.birth_date,
                              nationality: p.nationality,
                              jerseyNumber: p.jersey_number,
                              position: p.position,
                              teamName: p.team_name,
                              teamCode: p.team_code,
                              teamLogoUrl: p.team_logo_url,
                              teamColor: p.team_primary_color,
                              season: '2026/2027',
                              issueDate: '01/11/2026',
                              expirationDate: '30/06/2027',
                              status: p.license_status || 'VALIDATED',
                              address: p.address,
                              photoUrl: p.photo_url,
                              qrSvg: p.qr_svg
                            })
                          }
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Journal d'activité */}
          {activeTab === 'Journal d\'activité' && isAdmin && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-[#172033] tracking-tight">Journal d'Audit et Sécurité</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Traçabilité des opérations administratives.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date / Heure</th>
                      <th className="py-3 px-4">Utilisateur</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entité</th>
                      <th className="py-3 px-4">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.created_at}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {log.username} <span className="text-[10px] text-slate-400 font-normal">({log.role})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{log.entity_type}</td>
                        <td className="py-3 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Footer de page principal */}
          <footer className="mt-12 py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
            <p>
              Next Generation Cup 2026 — Teranga Agency • Tous droits réservés
            </p>
            <p className="mt-1">
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
          </footer>
        </main>
      </div>

      {/* MODAL: Saisie et validation du score */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172033]">
                Score Officiel du Match
              </h3>
              <button onClick={() => setScoringMatch(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="mt-4 space-y-4 text-xs">
              <div className="text-center font-bold text-slate-700">
                {scoringMatch.phase} • {scoringMatch.venue}
              </div>

              <div className="grid grid-cols-3 items-center gap-3">
                <div className="text-center">
                  <div className="font-extrabold text-slate-900 mb-1">{scoringMatch.home_team_name}</div>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={scoreForm.homeScore}
                    onChange={(e) => setScoreForm({ ...scoreForm, homeScore: Number(e.target.value) })}
                    className="w-full text-center text-2xl font-black p-3 rounded-xl border border-slate-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="text-center text-slate-400 font-black text-xl">VS</div>

                <div className="text-center">
                  <div className="font-extrabold text-slate-900 mb-1">{scoringMatch.away_team_name}</div>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={scoreForm.awayScore}
                    onChange={(e) => setScoreForm({ ...scoreForm, awayScore: Number(e.target.value) })}
                    className="w-full text-center text-2xl font-black p-3 rounded-xl border border-slate-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statut du match</label>
                <select
                  value={scoreForm.status}
                  onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                >
                  <option value="COMPLETED">Terminé (Impacte le classement)</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="POSTPONED">Reporté</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarques ou faits de jeu (Buteurs, Cartons)</label>
                <textarea
                  value={scoreForm.notes}
                  onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                  placeholder="ex: Buts 24' Essien, 78' Diallo. Carton jaune 45' Silva."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScoringMatch(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={scoreLoading}
                  className="px-4 py-2 rounded-lg bg-[#157a38] hover:bg-[#11662e] text-white font-bold cursor-pointer transition"
                >
                  {scoreLoading ? 'Enregistrement...' : 'Valider le Résultat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Programmer un match */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172033]">
                Programmer une Rencontre
              </h3>
              <button onClick={() => setShowAddMatchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMatch} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Équipe Domicile *</label>
                  <select
                    required
                    value={newMatchForm.homeTeamId}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, homeTeamId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Sélectionner</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Équipe Visiteuse *</label>
                  <select
                    required
                    value={newMatchForm.awayTeamId}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, awayTeamId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Sélectionner</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phase de Compétition</label>
                  <select
                    value={newMatchForm.phase}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, phase: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    {phaseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Groupe / Poule</label>
                  <select
                    value={newMatchForm.poolGroup}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, poolGroup: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="POULE_A">Poule A</option>
                    <option value="POULE_B">Poule B</option>
                    <option value="POULE_C">Poule C</option>
                    <option value="PHASE_FINALE">Phase Finale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newMatchForm.matchDate}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, matchDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure de coup d'envoi *</label>
                  <input
                    type="time"
                    required
                    value={newMatchForm.matchTime}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, matchTime: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stade ou Terrain *</label>
                <input
                  type="text"
                  required
                  value={newMatchForm.venue}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, venue: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  placeholder="ex: Stade Municipal - Terrain 1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={matchActionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition"
                >
                  {matchActionLoading ? 'Programmation...' : 'Confirmer la Rencontre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUCCÈS: Identifiants Dirigeant créés prêts à être remis */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-emerald-100 text-[#157a38] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Équipe Enregistrée avec Succès !
            </h3>
            <p className="text-xs text-slate-600 mt-1 mb-5">
              Voici la fiche d'accès officielle à transmettre au dirigeant de{' '}
              <strong className="text-slate-900 font-bold">{createdCredentialsModal.teamName}</strong>.
            </p>

            {/* Fiche d'accès à remettre au dirigeant */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 text-left text-xs space-y-3 mb-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Club Officiel</span>
                <span className="font-extrabold text-slate-900">{createdCredentialsModal.teamName} ({createdCredentialsModal.code})</span>
              </div>
              {createdCredentialsModal.managerName && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dirigeant</span>
                  <span className="font-bold text-slate-800">{createdCredentialsModal.managerName}</span>
                </div>
              )}
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">Identifiant</span>
                <span className="font-mono font-black text-slate-900 text-sm select-all">
                  {createdCredentialsModal.username}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">Mot de passe</span>
                <span className="font-mono font-black text-[#157a38] text-sm select-all">
                  {createdCredentialsModal.password}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 italic text-center pt-1">
                L'accès est strictement isolé pour lui permettre de gérer son effectif (max 30 joueurs).
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `🏆 ACCÈS OFFICIEL NEXT GENERATION CUP 2026\nClub: ${createdCredentialsModal.teamName} (${createdCredentialsModal.code})\nDirigeant: ${createdCredentialsModal.managerName || 'Responsable'}\nIdentifiant: ${createdCredentialsModal.username}\nMot de passe: ${createdCredentialsModal.password}\nLien de connexion: http://localhost:3000`
                  navigator.clipboard.writeText(text)
                  notify('📋 Fiche d’accès copiée dans le presse-papier !')
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
              >
                <Copy size={15} /> Copier les identifiants
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentialsModal(null)}
                className="py-3 px-5 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ajouter une équipe */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-[#f5b800]" />
                <h3 className="text-base font-extrabold text-[#172033]">
                  Enregistrer une Nouvelle Équipe
                </h3>
              </div>
              <button onClick={() => setShowAddTeamModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTeam} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nom officiel du club *</label>
                  <input
                    type="text"
                    required
                    value={newTeamForm.name}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                    placeholder="ex: Olympique Lyonnais"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code court *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={newTeamForm.code}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none uppercase font-mono"
                    placeholder="ex: OL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newTeamForm.city}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                    placeholder="ex: Lyon"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Poule attribuée</label>
                  <select
                    value={newTeamForm.poolGroup}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, poolGroup: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="POULE_A">Poule A</option>
                    <option value="POULE_B">Poule B</option>
                    <option value="POULE_C">Poule C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTeamForm.primaryColor}
                      onChange={(e) => setNewTeamForm({ ...newTeamForm, primaryColor: e.target.value })}
                      className="size-9 rounded cursor-pointer border border-slate-300"
                    />
                    <span className="font-mono text-slate-600 text-[10px]">{newTeamForm.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Logo officiel du club */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Logo ou Blason du club (Optionnel)
                </label>
                <div className="flex items-center gap-3">
                  {newTeamForm.logoUrl ? (
                    <img
                      src={newTeamForm.logoUrl}
                      alt="Logo club"
                      className="size-11 rounded-lg object-contain border border-slate-200 bg-white p-0.5"
                    />
                  ) : (
                    <div
                      className="size-11 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: newTeamForm.primaryColor }}
                    >
                      {newTeamForm.code ? newTeamForm.code.substring(0, 3) : 'LOGO'}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (uploadEvent) => {
                          const base64 = uploadEvent.target?.result as string
                          setNewTeamForm({ ...newTeamForm, logoUrl: base64 })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Informations du Dirigeant Responsable */}
              <div className="pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-900 block mb-2">Responsable du Club</span>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Nom du Responsable</label>
                    <input
                      type="text"
                      value={newTeamForm.managerName}
                      onChange={(e) => setNewTeamForm({ ...newTeamForm, managerName: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#157a38] focus:outline-none"
                      placeholder="ex: Mamadou Ndiaye"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={newTeamForm.managerPhone}
                      onChange={(e) => setNewTeamForm({ ...newTeamForm, managerPhone: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#157a38] focus:outline-none"
                      placeholder="+221 77 000 00 00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">E-mail de contact</label>
                  <input
                    type="email"
                    value={newTeamForm.managerEmail}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, managerEmail: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#157a38] focus:outline-none"
                    placeholder="contact@club.sn"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={teamActionLoading}
                  className="px-4 py-2 rounded-lg bg-[#157a38] text-white font-bold cursor-pointer hover:bg-[#0f602b]"
                >
                  {teamActionLoading ? 'Création...' : 'Ajouter l’équipe'}
                </button>
              </div>
                  disabled={teamActionLoading}
                  className="px-4 py-2 rounded-lg bg-[#0f3d23] hover:bg-[#157a38] text-white font-bold cursor-pointer transition disabled:opacity-50"
                >
                  {teamActionLoading ? 'Création...' : 'Créer l’Équipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajouter un joueur */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#172033]">
                {isManager ? 'Inscrire un joueur dans mon équipe' : 'Enregistrer un nouveau joueur'}
              </h3>
              <button onClick={() => setShowAddPlayerModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="mt-4 space-y-3.5 text-xs">
              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Équipe de rattachement *</label>
                  {teams.length === 0 ? (
                    <div className="text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                      ⚠️ Aucune équipe n'existe. Veuillez d'abord ajouter une équipe.
                    </div>
                  ) : (
                    <select
                      required
                      value={newPlayerForm.teamId || teams[0]?.id}
                      onChange={(e) => setNewPlayerForm({ ...newPlayerForm, teamId: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPlayerForm.firstName}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                    placeholder="ex: Michael"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newPlayerForm.lastName}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                    placeholder="ex: ESSIEN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={newPlayerForm.birthDate}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, birthDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nationalité *</label>
                  <input
                    type="text"
                    required
                    value={newPlayerForm.nationality}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, nationality: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Maillot *</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newPlayerForm.jerseyNumber}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, jerseyNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none font-bold"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Poste *</label>
                  <select
                    value={newPlayerForm.position}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, position: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none font-semibold"
                  >
                    <option value="GARDIEN">Gardien</option>
                    <option value="DEFENSEUR">Défenseur</option>
                    <option value="MILIEU">Milieu</option>
                    <option value="ATTAQUANT">Attaquant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pied dominant</label>
                  <select
                    value={newPlayerForm.dominantFoot}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, dominantFoot: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="DROIT">Droit</option>
                    <option value="GAUCHE">Gauche</option>
                    <option value="AMBIDEXTRE">Ambidextre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Domicile / Adresse de résidence *
                </label>
                <input
                  type="text"
                  required
                  value={newPlayerForm.address}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#157a38] focus:outline-none"
                  placeholder="ex: Quartier Médina, Dakar ou Thiès"
                />
              </div>

              {/* CHAMP PHOTO OBLIGATOIRE */}
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/30">
                <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <Camera size={16} /> Photo d'identité officielle du joueur *
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Obligatoire pour la licence
                  </span>
                </label>

                <div className="flex items-center gap-4 mt-2">
                  <div className="size-20 rounded-xl border border-slate-300 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {newPlayerForm.photoUrl ? (
                      <img src={newPlayerForm.photoUrl} alt="Aperçu joueur" className="size-full object-cover" />
                    ) : (
                      <UserRound size={32} className="text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setNewPlayerForm({ ...newPlayerForm, photoUrl: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#157a38] file:text-white hover:file:bg-[#11662e] file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Format JPG ou PNG (photo type passeport / licence claire et visible de face).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations administratives</label>
                <textarea
                  value={newPlayerForm.observations}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, observations: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-amber-500 focus:outline-none"
                  rows={2}
                  placeholder="Certificat médical conforme, licence validée..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={playerActionLoading}
                  className="px-4 py-2 rounded-lg bg-[#157a38] hover:bg-[#11662e] text-white font-bold cursor-pointer transition disabled:opacity-50"
                >
                  {playerActionLoading ? 'Vérification...' : 'Soumettre le dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Motif de rejet */}
      {rejectingPlayerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-rose-600 mb-2">Rejeter le dossier du joueur</h3>
            <p className="text-xs text-slate-500 mb-4">
              Veuillez spécifier le motif administratif du rejet pour notification au dirigeant.
            </p>
            <textarea
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="ex: Certificat médical manquant ou pièce d'identité non lisible."
              className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:border-rose-500 focus:outline-none"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectingPlayerId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleValidatePlayer(rejectingPlayerId, 'REJECT', rejectionReason)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ajouter manuellement une licence */}
      {showAddLicenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900">
                Émettre une Licence Officielle
              </h3>
              <button onClick={() => setShowAddLicenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sélectionner le joueur *</label>
                <select
                  required
                  value={newLicenseForm.playerId}
                  onChange={(e) => setNewLicenseForm({ ...newLicenseForm, playerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- Choisir un joueur --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.last_name} {p.first_name} (#{p.jersey_number} - {p.team_name}) {p.license_number ? `[Licence: ${p.license_number}]` : '[Sans licence]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saison officielle</label>
                  <input
                    type="text"
                    required
                    value={newLicenseForm.season}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, season: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut initial</label>
                  <select
                    value={newLicenseForm.status}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="VALIDATED">Validée (Active)</option>
                    <option value="SUSPENDED">Suspendue</option>
                    <option value="EXPIRED">Expirée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'émission</label>
                  <input
                    type="date"
                    required
                    value={newLicenseForm.issueDate}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    required
                    value={newLicenseForm.expirationDate}
                    onChange={(e) => setNewLicenseForm({ ...newLicenseForm, expirationDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLicenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={licenseActionLoading}
                  className="px-4 py-2 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white font-bold cursor-pointer transition disabled:opacity-50"
                >
                  {licenseActionLoading ? 'Génération...' : 'Émettre la licence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Modifier une licence */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Modifier la Licence {editingLicense.license_number}
                </h3>
                <span className="text-xs text-slate-500 font-medium">Joueur: {editingLicense.playerName}</span>
              </div>
              <button onClick={() => setEditingLicense(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpdateLicense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saison</label>
                  <input
                    type="text"
                    required
                    value={editingLicense.season}
                    onChange={(e) => setEditingLicense({ ...editingLicense, season: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut</label>
                  <select
                    value={editingLicense.status}
                    onChange={(e) => setEditingLicense({ ...editingLicense, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="VALIDATED">Validée (Active)</option>
                    <option value="SUSPENDED">Suspendue</option>
                    <option value="EXPIRED">Expirée</option>
                    <option value="REVOKED">Révoquée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'émission</label>
                  <input
                    type="date"
                    required
                    value={editingLicense.issue_date}
                    onChange={(e) => setEditingLicense({ ...editingLicense, issue_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'expiration</label>
                  <input
                    type="date"
                    required
                    value={editingLicense.expiration_date}
                    onChange={(e) => setEditingLicense({ ...editingLicense, expiration_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={licenseActionLoading}
                  className="px-4 py-2 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white font-bold cursor-pointer transition disabled:opacity-50"
                >
                  {licenseActionLoading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Détails du Joueur avec Photo Agrandie & Actions Rapides */}
      {selectedPlayerDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlayerDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            {/* En-tête avec Photo et Titre */}
            <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 pb-5">
              <div
                className="relative size-28 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-100 shadow-md shrink-0 cursor-pointer group"
                onClick={() => {
                  if (selectedPlayerDetail.photo_url) {
                    setEnlargedPhotoUrl(selectedPlayerDetail.photo_url)
                  }
                }}
                title="Cliquer pour agrandir la photo en plein écran"
              >
                {selectedPlayerDetail.photo_url ? (
                  <img
                    src={selectedPlayerDetail.photo_url}
                    alt={`${selectedPlayerDetail.last_name}`}
                    className="size-full object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <div className="size-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl">
                    #{selectedPlayerDetail.jersey_number}
                  </div>
                )}
                {selectedPlayerDetail.photo_url && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    🔍 Agrandir
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 text-xs font-mono font-black mb-1">
                  Maillot #{selectedPlayerDetail.jersey_number}
                </div>
                <h3 className="text-xl font-black text-slate-900 truncate">
                  {selectedPlayerDetail.last_name} {selectedPlayerDetail.first_name}
                </h3>
                <p className="text-xs font-bold text-[#157a38] mt-0.5">
                  {selectedPlayerDetail.team_name}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {selectedPlayerDetail.position}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedPlayerDetail.status === 'VALIDATED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedPlayerDetail.status === 'SUBMITTED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : selectedPlayerDetail.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    ● {selectedPlayerDetail.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Grille d'informations détaillées */}
            <div className="mt-5 grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date de naissance</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedPlayerDetail.birth_date}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Nationalité</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedPlayerDetail.nationality}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Domicile / Adresse</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedPlayerDetail.address || 'Non renseigné'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pied dominant</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedPlayerDetail.dominant_foot || 'DROIT'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">N° Licence</span>
                <span className="font-mono font-black text-[#157a38] block mt-0.5">
                  {selectedPlayerDetail.license_number || 'Non émise'}
                </span>
              </div>
            </div>

            {selectedPlayerDetail.observations && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Observations</span>
                <p className="text-slate-700 mt-0.5">{selectedPlayerDetail.observations}</p>
              </div>
            )}

            {selectedPlayerDetail.rejection_reason && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Motif de rejet</span>
                <p className="text-rose-900 mt-0.5 font-medium">{selectedPlayerDetail.rejection_reason}</p>
              </div>
            )}

            {/* Actions Administrateur (Valider / Rejeter / Voir Licence) */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPlayerDetail.license_number && (
                  <button
                    onClick={() => {
                      setSelectedPlayerLicense({
                        licenseNumber: selectedPlayerDetail.license_number,
                        firstName: selectedPlayerDetail.first_name,
                        lastName: selectedPlayerDetail.last_name,
                        birthDate: selectedPlayerDetail.birth_date,
                        nationality: selectedPlayerDetail.nationality,
                        jerseyNumber: selectedPlayerDetail.jersey_number,
                        position: selectedPlayerDetail.position,
                        teamName: selectedPlayerDetail.team_name,
                        teamCode: selectedPlayerDetail.team_code,
                        teamLogoUrl: selectedPlayerDetail.team_logo_url,
                        teamColor: selectedPlayerDetail.team_primary_color,
                        season: '2026/2027',
                        issueDate: '01/11/2026',
                        expirationDate: '30/06/2027',
                        status: selectedPlayerDetail.license_status || 'VALIDATED',
                        address: selectedPlayerDetail.address,
                        photoUrl: selectedPlayerDetail.photo_url,
                        qrSvg: selectedPlayerDetail.qr_svg
                      })
                      setSelectedPlayerDetail(null)
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode size={14} /> Voir Licence
                  </button>
                )}
                {selectedPlayerDetail.photo_url && (
                  <button
                    onClick={() => setEnlargedPhotoUrl(selectedPlayerDetail.photo_url)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera size={14} /> Agrandir Photo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && selectedPlayerDetail.status !== 'VALIDATED' && (
                  <button
                    onClick={() => {
                      handleValidatePlayer(selectedPlayerDetail.id, 'VALIDATE')
                      setSelectedPlayerDetail(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#157a38] hover:bg-[#0f602b] text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    ✓ Valider le dossier
                  </button>
                )}
                {isAdmin && selectedPlayerDetail.status === 'SUBMITTED' && (
                  <button
                    onClick={() => {
                      setRejectingPlayerId(selectedPlayerDetail.id)
                      setSelectedPlayerDetail(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    ✕ Rejeter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Visualiseur Photo Agrandie Plein Écran */}
      {enlargedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setEnlargedPhotoUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-slate-950 p-2 rounded-3xl border border-white/20 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEnlargedPhotoUrl(null)}
              className="absolute -top-3 -right-3 size-9 rounded-full bg-white text-slate-900 font-black flex items-center justify-center shadow-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Fermer la photo"
            >
              <X size={18} />
            </button>
            <img
              src={enlargedPhotoUrl}
              alt="Photo officielle du joueur"
              className="w-full max-h-[80vh] object-contain rounded-2xl mx-auto"
            />
            <div className="py-2 text-xs text-slate-400 font-medium">
              Photo officielle du joueur (Next Generation Cup)
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Aperçu Licence Card */}
      {selectedPlayerLicense && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-800 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlayerLicense(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-4">
              <h3 className="text-lg font-black text-white">Licence de Joueur Officielle</h3>
              <p className="text-xs text-slate-400">Homologuée avec QR Code de contrôle</p>
            </div>
            <LicenseCard
              license={selectedPlayerLicense}
              onDownloadPdf={() => downloadLicenseDocument(selectedPlayerLicense)}
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#172033] border border-white/10 px-4 py-3 text-xs font-bold text-white shadow-2xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
