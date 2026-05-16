import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import OverviewView from '../components/views/OverviewView'
import TicketsView from '../components/views/TicketsView'
import { useAuth } from '../contexts/AuthContext'
import { useToast, LoadingScreen } from '../components/ui/UI'
import { api } from '../api'

/* Placeholder for views not yet implemented */
function ComingSoon({ title }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚧</div>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)' }}>Esta sección estará disponible próximamente.</p>
    </div>
  )
}

function DevView({ guildId }) {
  const toast = useToast()
  const [gId, setGId] = useState(guildId || '')
  const [days, setDays] = useState('30')
  const [perm, setPerm] = useState(false)
  const [saving, setSaving] = useState(false)
  const grant = async (active) => {
    setSaving(true)
    try {
      await api.post(`/api/dev/premium/${gId}`, { isPremium: active, days: perm ? null : parseInt(days), permanent: perm })
      toast(active ? '⚡ Premium activado' : 'Premium revocado', 'success')
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }
  return (
    <div>
      <div className="view-header"><h1 style={{ color: '#ff6ef7' }}>⚡ Dev Terminal</h1></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-header"><h3 style={{ color: '#ff6ef7' }}>Gestión Premium</h3></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">ID del Servidor</label>
            <input className="form-input" value={gId} onChange={e => setGId(e.target.value)} placeholder="123456789..." />
          </div>
          <div className="form-group">
            <label className="form-label">Duración (días)</label>
            <input className="form-input" type="number" value={days} onChange={e => setDays(e.target.value)} disabled={perm} />
          </div>
          <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="checkbox" id="perm" checked={perm} onChange={e => setPerm(e.target.checked)} />
            <label htmlFor="perm" className="form-label" style={{ margin:0 }}>Permanente</label>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn" style={{ background:'rgba(255,0,255,0.1)', color:'#ff6ef7', border:'1px solid #ff6ef7' }} onClick={() => grant(true)} disabled={saving}>
              ⚡ Activar Premium
            </button>
            <button className="btn btn-danger" onClick={() => grant(false)} disabled={saving}>
              Revocar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { guildId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [servers, setServers] = useState([])

  useEffect(() => {
    api.getServers()
      .then(d => setServers(d.serversWithBot || []))
      .catch(() => {})
  }, [])

  const handleServerChange = (id) => navigate(`/server/${id}/overview`)

  return (
    <div className="app-layout">
      <Sidebar guildId={guildId} isDev={user?.isDev} />
      <div className="main-area">
        <Topbar servers={servers} currentGuild={guildId} onServerChange={handleServerChange} />
        <main className="page-content">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"      element={<OverviewView guildId={guildId} />} />
            <Route path="tickets"       element={<TicketsView guildId={guildId} />} />
            <Route path="logs"          element={<ComingSoon title="Ticket Logs" />} />
            <Route path="moderation"    element={<ComingSoon title="Moderación" />} />
            <Route path="levels"        element={<ComingSoon title="Levels & XP" />} />
            <Route path="faq"           element={<ComingSoon title="FAQ Panels" />} />
            <Route path="autoresponse"  element={<ComingSoon title="Auto Responses" />} />
            <Route path="polls"         element={<ComingSoon title="Polls" />} />
            <Route path="verification"  element={<ComingSoon title="Verification" />} />
            <Route path="premium"       element={<ComingSoon title="Premium" />} />
            <Route path="dev"           element={user?.isDev ? <DevView guildId={guildId} /> : <Navigate to="overview" />} />
            <Route path="*"             element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
