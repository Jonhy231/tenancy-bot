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
  const [servers, setServers] = useState([])
  const [loadingServers, setLoadingServers] = useState(true)

  useEffect(() => {
    api.get('/api/dev/servers')
      .then(d => setServers(d.servers || []))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoadingServers(false))
  }, [])

  const grant = async (active) => {
    setSaving(true)
    try {
      await api.post(`/api/dev/premium/${gId}`, { isPremium: active, days: perm ? null : parseInt(days), permanent: perm })
      toast(active ? '⚡ Premium activado' : 'Premium revocado', 'success')
      // Refrescar tabla
      const d = await api.get('/api/dev/servers')
      setServers(d.servers || [])
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="view-header"><h1 style={{ color: '#ff6ef7' }}>⚡ Dev Terminal</h1></div>

      {/* Premium Management */}
      <div className="card" style={{ maxWidth: 500, marginBottom: 24 }}>
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

      {/* Servers Usage Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ color: '#ff6ef7' }}>📊 Consumo de Tickets por Servidor</h3>
          <span className="badge badge-gray">{servers.length} servidores</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loadingServers ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
          ) : servers.length === 0 ? (
            <div className="empty-state"><p>No hay servidores registrados</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Servidor</th>
                    <th>Miembros</th>
                    <th>Uso Mensual</th>
                    <th>Total Histórico</th>
                    <th>Modo</th>
                    <th>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map(s => {
                    const pct = s.isPremium ? 0 : Math.min((s.monthlyTicketsUsed / 50) * 100, 100)
                    const isNearLimit = pct >= 80
                    const isAtLimit = pct >= 100
                    return (
                      <tr key={s.guildId} onClick={() => setGId(s.guildId)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            {s.guildIcon
                              ? <img src={s.guildIcon} alt="" style={{ width:24, height:24, borderRadius:'50%' }} />
                              : <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'var(--accent)' }}>{s.guildName?.[0]}</div>
                            }
                            <div>
                              <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text-primary)' }}>{s.guildName}</div>
                              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{s.guildId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.memberCount.toLocaleString()}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:6, background:'var(--bg-primary)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                              <div style={{
                                width: s.isPremium ? '0%' : `${pct}%`,
                                height: '100%',
                                background: isAtLimit ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--success)',
                                borderRadius: 3,
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize:'0.8rem', fontWeight:600, color: isAtLimit ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--text-secondary)' }}>
                              {s.monthlyTicketsUsed}/{s.monthlyLimit}
                            </span>
                          </div>
                        </td>
                        <td>{s.totalTicketsCreated}</td>
                        <td><span className="badge badge-gray">{s.ticketMode === 'custom' ? '🎨 Custom' : '📋 Clásico'}</span></td>
                        <td>
                          {s.isPremium
                            ? <span className="badge badge-green">⭐ Premium</span>
                            : <span className="badge badge-gray">Free</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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
