import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast, LoadingScreen } from '../components/ui/UI'

export default function ServersPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServers()
      .then(setData)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen text="Cargando servidores..." />

  const { serversWithBot = [], serversWithoutBot = [] } = data || {}

  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${window.__CLIENT_ID__ || ''}&permissions=8&scope=bot%20applications.commands`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
            Ten<span style={{ color: 'var(--accent)' }}>ancy</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Selecciona un servidor para administrar</p>
        </div>

        {/* Servers with bot */}
        {serversWithBot.length > 0 && (
          <>
            <div className="section-divider"><span>Servidores con Tenancy</span></div>
            <div className="servers-grid" style={{ marginBottom: 40 }}>
              {serversWithBot.map(s => (
                <div key={s.id} className="server-card" onClick={() => navigate(`/server/${s.id}/overview`)}>
                  {s.icon
                    ? <img src={s.icon} alt={s.name} />
                    : <div className="server-no-icon">{s.name[0]}</div>
                  }
                  <h3>{s.name}</h3>
                  <p>{s.memberCount?.toLocaleString() || '—'} miembros</p>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>● Bot activo</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Servers without bot */}
        {serversWithoutBot.length > 0 && (
          <>
            <div className="section-divider"><span>Sin Tenancy</span></div>
            <div className="servers-grid">
              {serversWithoutBot.map(s => (
                <a
                  key={s.id}
                  href={`${inviteUrl}&guild_id=${s.id}`}
                  target="_blank" rel="noreferrer"
                  className="server-card"
                  style={{ textDecoration: 'none', opacity: 0.65 }}
                >
                  {s.icon
                    ? <img src={s.icon} alt={s.name} style={{ filter: 'grayscale(0.5)' }} />
                    : <div className="server-no-icon" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{s.name[0]}</div>
                  }
                  <h3>{s.name}</h3>
                  <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>+ Invitar bot</span>
                </a>
              ))}
            </div>
          </>
        )}

        {serversWithBot.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <p>No tienes servidores con Tenancy activo.</p>
            <a href={inviteUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 16 }}>
              Invitar a mi servidor
            </a>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/auth/logout" className="btn btn-ghost btn-sm">Cerrar sesión</a>
        </div>
      </div>
    </div>
  )
}
