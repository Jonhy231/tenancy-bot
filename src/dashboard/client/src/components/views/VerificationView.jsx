import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function VerificationView({ guildId }) {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [channels, setChannels] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [panelChannelId, setPanelChannelId] = useState('')

  useEffect(() => {
    Promise.all([
      api.getServer(guildId),
      api.getChannels(guildId),
      api.getRoles(guildId),
    ]).then(([srv, ch, rs]) => {
      setConfig(srv.config.verification || {
        enabled: false, roleId: '', channelId: '', messageId: '',
        embedTitle: '✅ Verificación', embedDescription: 'Haz clic en el botón de abajo para verificarte y acceder al servidor.',
        embedColor: '#57F287', buttonLabel: 'Verificarme', buttonEmoji: '✅'
      })
      setChannels(ch.textChannels || [])
      setRoles(rs || [])
    }).catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, { verification: config })
      toast('✅ Verificación guardada', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const sendPanel = async () => {
    if (!config.roleId) return toast('Primero debes seleccionar un rol a dar', 'error')
    if (!panelChannelId) return toast('Selecciona el canal destino para el panel', 'error')
    
    // Auto-guardar antes de enviar
    await api.updateConfig(guildId, { verification: config })
    
    setSending(true)
    try {
      await api.post(`/api/server/${guildId}/verification/send`, { channelId: panelChannelId })
      toast('✅ Panel de verificación enviado/actualizado en Discord', 'success')
      // Refrescar para obtener el messageId nuevo
      const srv = await api.getServer(guildId)
      setConfig(srv.config.verification)
    } catch (e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  if (loading || !config) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>🔒 Sistema de Verificación</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Habilitar Verificación</h3>
            <p className="text-muted text-sm">Bloquea el acceso al servidor hasta que el usuario se verifique</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
            <span className="slider" />
          </label>
        </div>
      </div>

      {config.enabled && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          
          {/* Configuración */}
          <div className="card">
            <div className="card-header"><h3>Ajustes del Panel</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Rol de Usuario Verificado</label>
                <select className="form-input" value={config.roleId} onChange={e => setConfig({ ...config, roleId: e.target.value })}>
                  <option value="">Selecciona un rol...</option>
                  {roles.map(r => <option key={r.id} value={r.id} style={{ color: r.color !== '#000000' ? r.color : undefined }}>{r.name}</option>)}
                </select>
                <p className="form-hint">Este rol se le dará al usuario cuando haga clic en el botón.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Título del Panel</label>
                <input className="form-input" value={config.embedTitle} onChange={e => setConfig({ ...config, embedTitle: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={config.embedDescription} onChange={e => setConfig({ ...config, embedDescription: e.target.value })} />
              </div>

              <div className="form-group grid-2">
                <div>
                  <label className="form-label">Color (Hex)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" className="form-input" style={{ width: 50, padding: 0 }} value={config.embedColor} onChange={e => setConfig({ ...config, embedColor: e.target.value })} />
                    <input className="form-input" value={config.embedColor} onChange={e => setConfig({ ...config, embedColor: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-group grid-2">
                <div>
                  <label className="form-label">Emoji del Botón</label>
                  <input className="form-input" value={config.buttonEmoji} onChange={e => setConfig({ ...config, buttonEmoji: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Texto del Botón</label>
                  <input className="form-input" value={config.buttonLabel} onChange={e => setConfig({ ...config, buttonLabel: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Preview y Publicación */}
          <div className="card">
            <div className="card-header"><h3>📢 Publicar Panel en Discord</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Canal destino</label>
                <select className="form-input" value={panelChannelId} onChange={e => setPanelChannelId(e.target.value)}>
                  <option value="">Selecciona el canal (ej: #verificacion)...</option>
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
                    
                    <div className="discord-embed" style={{ borderLeftColor: config.embedColor }}>
                      <div className="discord-embed-title">{config.embedTitle}</div>
                      <div className="discord-embed-desc" style={{ whiteSpace: 'pre-wrap' }}>{config.embedDescription}</div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <button className="discord-btn success">
                        {config.buttonEmoji} {config.buttonLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={sendPanel} disabled={sending || !panelChannelId || !config.roleId}>
                {sending ? 'Publicando...' : '🚀 Enviar / Actualizar Panel'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
