import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function FAQView({ guildId }) {
  const toast = useToast()
  const [faq, setFaq] = useState([])
  const [panelChannelId, setPanelChannelId] = useState('')
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Form
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [e, setE] = useState('❓')

  useEffect(() => {
    Promise.all([
      api.getServer(guildId),
      api.getChannels(guildId),
    ]).then(([srv, ch]) => {
      setFaq(srv.config.faq || [])
      setPanelChannelId(srv.config.faqPanelChannelId || '')
      setChannels(ch.textChannels || [])
    }).catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const save = async (newFaq = faq) => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, { faq: newFaq })
      toast('✅ FAQ guardado', 'success')
      setFaq(newFaq)
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const addFaq = () => {
    if (!q || !a) return toast('Pregunta y respuesta requeridas', 'error')
    const id = Date.now().toString()
    const newFaqList = [...faq, { id, question: q, answer: a, emoji: e || '❓' }]
    save(newFaqList)
    setQ(''); setA(''); setE('❓')
  }

  const removeFaq = (id) => {
    save(faq.filter(f => f.id !== id))
  }

  const sendPanel = async () => {
    if (!panelChannelId) return toast('Selecciona un canal para enviar el panel', 'error')
    if (faq.length === 0) return toast('No hay FAQs para enviar', 'error')
    setSending(true)
    try {
      await api.post(`/api/server/${guildId}/faq/send`, { channelId: panelChannelId })
      toast('✅ Panel de FAQ enviado/actualizado en Discord', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setSending(false) }
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>❓ Preguntas Frecuentes (FAQ)</h1>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* Editor */}
        <div className="card">
          <div className="card-header"><h3>Añadir Pregunta</h3></div>
          <div className="card-body">
            <div className="form-group" style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 60 }}>
                <label className="form-label">Emoji</label>
                <input className="form-input" value={e} onChange={ev => setE(ev.target.value)} placeholder="❓" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Pregunta</label>
                <input className="form-input" value={q} onChange={ev => setQ(ev.target.value)} placeholder="Ej: ¿Cómo compro premium?" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Respuesta</label>
              <textarea className="form-input" value={a} onChange={ev => setA(ev.target.value)} rows={3} placeholder="La respuesta que dará el bot..." />
            </div>
            <button className="btn btn-primary" onClick={addFaq} disabled={saving || !q || !a}>
              {saving ? 'Guardando...' : '➕ Añadir FAQ'}
            </button>
          </div>

          <div className="card-header" style={{ marginTop: 20 }}><h3>Lista de FAQs ({faq.length}/25)</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {faq.length === 0 ? (
              <div className="empty-state">No hay preguntas creadas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {faq.map((f, i) => (
                  <div key={f.id} style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: '1.5rem' }}>{f.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.question}</div>
                      <div className="text-muted text-sm">{f.answer}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeFaq(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Setup */}
        <div className="card">
          <div className="card-header"><h3>📢 Publicar Panel en Discord</h3></div>
          <div className="card-body">
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
              Envía un mensaje con un menú desplegable. Los usuarios podrán elegir una pregunta y el bot les responderá la respuesta de forma privada.
            </p>
            <div className="form-group">
              <label className="form-label">Canal del Panel</label>
              <select className="form-input" value={panelChannelId} onChange={ev => setPanelChannelId(ev.target.value)}>
                <option value="">Selecciona un canal...</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div className="discord-preview" style={{ marginBottom: 16 }}>
              <div className="discord-msg">
                <div className="discord-avatar bot" />
                <div className="discord-content">
                  <div className="discord-header">
                    <span className="discord-author">Tenancy</span>
                    <span className="discord-bot-tag">BOT</span>
                  </div>
                  
                  <div className="discord-embed" style={{ borderLeftColor: '#5865F2' }}>
                    <div className="discord-embed-title">❓ Preguntas Frecuentes</div>
                    <div className="discord-embed-desc">Selecciona una pregunta del menú de abajo para ver la respuesta.</div>
                  </div>

                  <div style={{ marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'not-allowed', opacity: 0.8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Selecciona una pregunta...</span>
                    <span>▼</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={sendPanel} disabled={sending || !panelChannelId || faq.length === 0}>
              {sending ? 'Enviando...' : '🚀 Enviar / Actualizar Panel'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
