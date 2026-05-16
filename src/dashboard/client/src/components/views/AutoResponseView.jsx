import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function AutoResponseView({ guildId }) {
  const toast = useToast()
  const [ar, setAr] = useState([])
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form
  const [trigger, setTrigger] = useState('')
  const [response, setResponse] = useState('')
  const [matchType, setMatchType] = useState('contains')
  const [selectedChannels, setSelectedChannels] = useState([])

  useEffect(() => {
    Promise.all([
      api.getServer(guildId),
      api.getChannels(guildId),
    ]).then(([srv, ch]) => {
      setAr(srv.config.autoResponses || [])
      setChannels(ch.textChannels || [])
    }).catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const save = async (newAr = ar) => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, { autoResponses: newAr })
      toast('✅ Auto-Respuestas guardadas', 'success')
      setAr(newAr)
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const addAr = () => {
    if (!trigger || !response) return toast('Trigger y respuesta requeridos', 'error')
    const id = Date.now().toString()
    const newItem = { id, trigger, response, matchType, channelIds: selectedChannels }
    save([...ar, newItem])
    setTrigger(''); setResponse(''); setMatchType('contains'); setSelectedChannels([])
  }

  const removeAr = (id) => {
    save(ar.filter(a => a.id !== id))
  }

  const toggleChannel = (chId) => {
    if (selectedChannels.includes(chId)) {
      setSelectedChannels(selectedChannels.filter(id => id !== chId))
    } else {
      setSelectedChannels([...selectedChannels, chId])
    }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>🤖 Auto-Respuestas</h1>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* Editor */}
        <div className="card">
          <div className="card-header"><h3>Crear Auto-Respuesta</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Si un usuario escribe...</label>
              <input className="form-input" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="Ej: ip del server" />
            </div>
            
            <div className="form-group" style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="matchType" checked={matchType === 'exact'} onChange={() => setMatchType('exact')} />
                Mensaje exacto
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="matchType" checked={matchType === 'contains'} onChange={() => setMatchType('contains')} />
                Contiene la frase
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">El bot responderá con...</label>
              <textarea className="form-input" value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="La IP es play.miprueba.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Filtro de Canales (opcional)</label>
              <p className="text-sm text-muted" style={{ marginBottom: 8 }}>Si no seleccionas ninguno, funcionará en todos los canales.</p>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', padding: 8, borderRadius: 4, background: 'var(--bg-secondary)' }}>
                {channels.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <input type="checkbox" checked={selectedChannels.includes(c.id)} onChange={() => toggleChannel(c.id)} />
                    <span className="text-sm">#{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={addAr} disabled={saving || !trigger || !response}>
              {saving ? 'Guardando...' : '➕ Añadir Auto-Respuesta'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="card">
          <div className="card-header"><h3>Tus Auto-Respuestas ({ar.length})</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {ar.length === 0 ? (
              <div className="empty-state">No hay respuestas configuradas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ar.map((a) => (
                  <div key={a.id} style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span className="badge badge-primary">{a.matchType === 'exact' ? 'Exacto' : 'Contiene'}</span>
                        <strong style={{ color: 'var(--accent)' }}>"{a.trigger}"</strong>
                      </div>
                      <div className="text-muted text-sm" style={{ marginBottom: 6 }}>{a.response}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Canales: {a.channelIds?.length > 0 ? a.channelIds.map(id => {
                          const ch = channels.find(c => c.id === id)
                          return ch ? `#${ch.name} ` : ''
                        }) : 'Todos'}
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeAr(a.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
