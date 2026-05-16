import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useToast, Spinner } from '../ui/UI'

export default function OverviewView({ guildId }) {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!guildId) return
    api.getServer(guildId)
      .then(setData)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
  if (!data) return null

  const { guild, stats, recentTickets } = data

  return (
    <div>
      <div className="view-header">
        <h1>📊 Vista General</h1>
        <p style={{ color: 'var(--text-muted)' }}>{guild?.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{stats?.totalTickets ?? 0}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats?.openTickets ?? 0}</div>
          <div className="stat-label">Abiertos</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{stats?.closedTickets ?? 0}</div>
          <div className="stat-label">Cerrados</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{stats?.categories ?? 0}</div>
          <div className="stat-label">Categorías</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>🕐 Tickets Recientes</h2></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Usuario</th><th>Categoría</th><th>Asunto</th><th>Estado</th><th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(!recentTickets || recentTickets.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'var(--text-muted)' }}>Sin tickets aún</td></tr>
                )}
                {recentTickets?.map(t => (
                  <tr key={t._id}>
                    <td>#{String(t.ticketNumber).padStart(4,'0')}</td>
                    <td>{t.userName}</td>
                    <td>{t.categoryName}</td>
                    <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.subject}</td>
                    <td>
                      <span className={`badge ${t.status === 'open' ? 'badge-green' : 'badge-red'}`}>
                        {t.status === 'open' ? '● Abierto' : '● Cerrado'}
                      </span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
