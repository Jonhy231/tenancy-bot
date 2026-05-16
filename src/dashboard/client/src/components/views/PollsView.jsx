import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function PollsView({ guildId }) {
  const toast = useToast()
  const [polls, setPolls] = useState([])
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Form
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([{ label: '', emoji: '' }, { label: '', emoji: '' }])
  const [channelId, setChannelId] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [duration, setDuration] = useState('24')

  const fetchPolls = () => {
    return api.get(`/api/server/${guildId}/polls`)
      .then(d => setPolls(d || []))
  }

  useEffect(() => {
    Promise.all([
      api.getChannels(guildId),
      fetchPolls()
    ]).then(([ch]) => {
      setChannels(ch.textChannels || [])
    }).catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))

    // Refresco cada 15s para ver votos
    const interval = setInterval(fetchPolls, 15000)
    return () => clearInterval(interval)
  }, [guildId])

  const addOption = () => {
    if (options.length >= 10) return toast('Máximo 10 opciones', 'error')
    setOptions([...options, { label: '', emoji: '' }])
  }

  const removeOption = (idx) => {
    if (options.length <= 2) return toast('Mínimo 2 opciones', 'error')
    setOptions(options.filter((_, i) => i !== idx))
  }

  const updateOption = (idx, field, val) => {
    const newOptions = [...options]
    newOptions[idx][field] = val
    setOptions(newOptions)
  }

  const createPoll = async () => {
    if (!question) return toast('Escribe una pregunta', 'error')
    if (!channelId) return toast('Selecciona un canal', 'error')
    const validOptions = options.filter(o => o.label.trim() !== '')
    if (validOptions.length < 2) return toast('Mínimo 2 opciones válidas', 'error')

    setSending(true)
    try {
      await api.post(`/api/server/${guildId}/polls`, {
        question,
        options: validOptions,
        channelId,
        isAnonymous,
        durationHours: parseInt(duration) || 24
      })
      toast('✅ Encuesta publicada', 'success')
      setQuestion('')
      setOptions([{ label: '', emoji: '' }, { label: '', emoji: '' }])
      await fetchPolls()
    } catch (e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  const closePoll = async (pollId) => {
    if (!confirm('¿Seguro que quieres cerrar esta encuesta ahora?')) return
    try {
      await api.post(`/api/server/${guildId}/polls/${pollId}/close`)
      toast('✅ Encuesta cerrada', 'success')
      await fetchPolls()
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>📊 Encuestas</h1>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* Creador */}
        <div className="card">
          <div className="card-header"><h3>Crear Nueva Encuesta</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Pregunta</label>
              <input className="form-input" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ej: ¿Qué juego jugamos hoy?" />
            </div>

            <div className="form-group">
              <label className="form-label">Opciones</label>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" style={{ width: 60 }} placeholder="Emoji" value={opt.emoji} onChange={e => updateOption(i, 'emoji', e.target.value)} />
                  <input className="form-input" style={{ flex: 1 }} placeholder={`Opción ${i + 1}`} value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} />
                  {options.length > 2 && (
                    <button className="btn btn-danger" onClick={() => removeOption(i)}>✕</button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <button className="btn btn-ghost btn-sm" onClick={addOption}>+ Añadir Opción</button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Canal destino</label>
              <select className="form-input" value={channelId} onChange={e => setChannelId(e.target.value)}>
                <option value="">Selecciona un canal...</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div className="form-group grid-2">
              <div>
                <label className="form-label">Duración (horas)</label>
                <input type="number" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                  Voto Anónimo
                </label>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={createPoll} disabled={sending || !question || !channelId}>
              {sending ? 'Publicando...' : '🚀 Publicar Encuesta'}
            </button>
          </div>
        </div>

        {/* Historial */}
        <div className="card">
          <div className="card-header">
            <h3>Encuestas Activas y Recientes</h3>
            <button className="btn btn-ghost btn-sm" onClick={fetchPolls}>🔄 Refresh</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {polls.length === 0 ? (
              <div className="empty-state">No hay encuestas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0)
                  
                  return (
                    <div key={poll._id} style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`badge ${poll.active ? 'badge-green' : 'badge-gray'}`}>
                              {poll.active ? 'Activa' : 'Cerrada'}
                            </span>
                            <span className="badge badge-primary">{poll.isAnonymous ? 'Anónima' : 'Pública'}</span>
                          </div>
                          <h4 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>{poll.question}</h4>
                          <div className="text-muted text-sm">
                            Canal: <span style={{ color: 'var(--accent)' }}>#{channels.find(c => c.id === poll.channelId)?.name || 'desconocido'}</span>
                            {' • '}{totalVotes} votos totales
                          </div>
                        </div>
                        {poll.active && (
                          <button className="btn btn-danger btn-sm" onClick={() => closePoll(poll._id)}>Cerrar</button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {poll.options.map((opt, i) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                          return (
                            <div key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                <span>{opt.emoji} {opt.label}</span>
                                <strong>{pct}% ({opt.votes})</strong>
                              </div>
                              <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
