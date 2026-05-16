import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function TicketLogsView({ guildId }) {
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTickets, setTotalTickets] = useState(0)
  const [filter, setFilter] = useState('all') // all, open, closed

  const fetchLogs = (p = 1, f = filter) => {
    setLoading(true)
    api.get(`/api/server/${guildId}/ticket-logs?page=${p}&limit=20&status=${f === 'all' ? '' : f}`)
      .then(d => {
        setLogs(d.tickets || [])
        setTotalPages(d.pages || 1)
        setTotalTickets(d.total || 0)
        setPage(d.page || 1)
      })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs(1, filter)
  }, [guildId, filter])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLogs(newPage, filter)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1>📋 Historial de Tickets</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="text-muted text-sm">{totalTickets} tickets en total</span>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 12px', height: 'auto', width: 'auto' }}>
            <option value="all">Todos los tickets</option>
            <option value="open">Solo Abiertos</option>
            <option value="closed">Solo Cerrados</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchLogs(page, filter)}>🔄</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading && logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">No hay tickets registrados.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Canal / ID</th>
                    <th>Estado</th>
                    <th>Creador</th>
                    <th>Categoría</th>
                    <th>Rating</th>
                    <th>Fecha de Creación</th>
                  </tr>
                </thead>
                <tbody style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
                  {logs.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>#{t.channelId}</div>
                        <div className="text-muted text-sm">{t._id}</div>
                      </td>
                      <td>
                        {t.status === 'open' 
                          ? <span className="badge badge-green">Abierto</span>
                          : <span className="badge badge-gray">Cerrado</span>
                        }
                      </td>
                      <td>{t.userId}</td>
                      <td>{t.categoryId}</td>
                      <td>
                        {t.rating > 0 
                          ? <span style={{ color: '#FFD700' }}>{'★'.repeat(t.rating)}</span>
                          : <span className="text-muted text-sm">-</span>
                        }
                      </td>
                      <td className="text-muted">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading}>Anterior</button>
            <span className="text-sm text-muted">Página {page} de {totalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || loading}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  )
}
