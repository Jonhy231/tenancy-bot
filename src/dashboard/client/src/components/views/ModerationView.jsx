import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function ModerationView({ guildId }) {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newWord, setNewWord] = useState('')

  useEffect(() => {
    Promise.all([
      api.getServer(guildId),
      api.getChannels(guildId),
    ]).then(([srv, ch]) => {
      setConfig(srv.config.moderation || { enabled: false, logChannelId: '', autoDeleteLinks: false, linkWhitelistChannels: [], autoDeleteSwearWords: false, customSwearWords: [], useDefaultSwearWords: true })
      setChannels(ch.textChannels || [])
    }).catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, { moderation: config })
      toast('✅ Moderación guardada', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const addWord = () => {
    if (!newWord.trim()) return
    const word = newWord.trim().toLowerCase()
    if (config.customSwearWords.includes(word)) return toast('Ya existe', 'error')
    setConfig({ ...config, customSwearWords: [...config.customSwearWords, word] })
    setNewWord('')
  }

  const removeWord = (w) => {
    setConfig({ ...config, customSwearWords: config.customSwearWords.filter(x => x !== w) })
  }

  const toggleWhitelist = (chId) => {
    const list = config.linkWhitelistChannels || []
    if (list.includes(chId)) {
      setConfig({ ...config, linkWhitelistChannels: list.filter(x => x !== chId) })
    } else {
      setConfig({ ...config, linkWhitelistChannels: [...list, chId] })
    }
  }

  if (loading || !config) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>🛡️ Moderación</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
      </div>

      {/* Master Toggle */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Sistema de Moderación</h3>
            <p className="text-muted text-sm">Activa o desactiva la moderación automática</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
            <span className="slider" />
          </label>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Log Channel */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>📋 Canal de Logs</h3></div>
            <div className="card-body">
              <select className="form-input" value={config.logChannelId} onChange={e => setConfig({ ...config, logChannelId: e.target.value })}>
                <option value="">Sin canal de logs</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Anti-Links */}
            <div className="card">
              <div className="card-header">
                <h3>🔗 Anti-Links</h3>
                <label className="switch">
                  <input type="checkbox" checked={config.autoDeleteLinks} onChange={e => setConfig({ ...config, autoDeleteLinks: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
              {config.autoDeleteLinks && (
                <div className="card-body">
                  <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Canales donde SÍ se permiten links (whitelist):</p>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {channels.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <input type="checkbox" checked={(config.linkWhitelistChannels || []).includes(c.id)} onChange={() => toggleWhitelist(c.id)} />
                        <span className="text-sm">#{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Anti-Swear */}
            <div className="card">
              <div className="card-header">
                <h3>🤬 Palabras Prohibidas</h3>
                <label className="switch">
                  <input type="checkbox" checked={config.autoDeleteSwearWords} onChange={e => setConfig({ ...config, autoDeleteSwearWords: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
              {config.autoDeleteSwearWords && (
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input type="checkbox" checked={config.useDefaultSwearWords !== false} onChange={e => setConfig({ ...config, useDefaultSwearWords: e.target.checked })} />
                    <span className="text-sm">Usar lista predeterminada</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Añadir palabra personalizada</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" value={newWord} onChange={e => setNewWord(e.target.value)} placeholder="Nueva palabra..." onKeyDown={e => e.key === 'Enter' && addWord()} />
                      <button className="btn btn-primary" onClick={addWord}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {config.customSwearWords.map(w => (
                      <span key={w} className="badge badge-gray" style={{ cursor: 'pointer' }} onClick={() => removeWord(w)}>
                        {w} ✕
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
