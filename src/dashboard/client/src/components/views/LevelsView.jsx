import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function LevelsView({ guildId }) {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [channels, setChannels] = useState([])
  const [roles, setRoles] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Nivel recompensa form
  const [newLevel, setNewLevel] = useState('')
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    Promise.all([
      api.getServer(guildId),
      api.getChannels(guildId),
      api.getRoles(guildId),
      api.get('/api/server/' + guildId + '/levels/leaderboard').catch(() => ({})),
    ]).then(([srv, ch, rs, lb]) => {
      setConfig(srv.config.levels || { enabled: false, xpPerMessage: 10, levelUpChannelId: '', levelUpMessage: '🎉 ¡Felicidades {user}! Has avanzado al nivel **{level}**.', roleRewards: [] })
      setChannels(ch.textChannels || [])
      setRoles(rs || [])
      setLeaderboard(Array.isArray(lb) ? lb : [])
    }).catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, { levels: config })
      toast('✅ Niveles guardados', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const addReward = () => {
    if (!newLevel) return toast('Por favor, ingresa un nivel.', 'error')
    
    const lvl = parseInt(newLevel, 10)
    if (isNaN(lvl) || lvl <= 0) return toast('El nivel debe ser un número mayor a 0.', 'error')
    
    if (!newRole) return toast('Por favor, selecciona un rol.', 'error')
    
    if (config.roleRewards.some(r => r.level === lvl)) return toast(`Ya hay una recompensa configurada para el nivel ${lvl}.`, 'error')
    if (config.roleRewards.some(r => r.roleId === newRole)) return toast('Este rol ya está asignado como recompensa en otro nivel.', 'error')
    
    setConfig({ ...config, roleRewards: [...config.roleRewards, { level: lvl, roleId: newRole }].sort((a,b) => a.level - b.level) })
    setNewLevel('')
    setNewRole('')
  }

  const removeReward = (lvl) => {
    setConfig({ ...config, roleRewards: config.roleRewards.filter(r => r.level !== lvl) })
  }

  const simulateXp = async () => {
    const userId = prompt("Ingresa el ID del usuario de Discord a simular:")
    if (!userId) return
    try {
      const res = await api.post(`/api/dev/simulate-xp/${guildId}`, { userId, xp: 100 })
      toast(`✅ +100 XP a ${userId}. Nivel actual: ${res.level} (${res.xp} XP)`, 'success')
      // Refrescar leaderboard
      const lb = await api.get('/api/server/' + guildId + '/levels/leaderboard')
      setLeaderboard(Array.isArray(lb) ? lb : [])
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading || !config) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      <div className="view-header">
        <h1>📈 Sistema de Niveles y XP</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>Habilitar Niveles</h3>
            <p className="text-muted text-sm">Da XP por mensaje y asigna roles automáticos</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
            <span className="slider" />
          </label>
        </div>
      </div>

      {config.enabled && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Config General */}
          <div className="card">
            <div className="card-header"><h3>⚙️ Configuración General</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">XP por mensaje</label>
                <input type="number" className="form-input" value={config.xpPerMessage} onChange={e => setConfig({ ...config, xpPerMessage: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Canal de Anuncios de Nivel (vacío = mismo canal)</label>
                <select className="form-input" value={config.levelUpChannelId} onChange={e => setConfig({ ...config, levelUpChannelId: e.target.value })}>
                  <option value="">(Responder en el mismo canal del mensaje)</option>
                  {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje de Level Up</label>
                <textarea className="form-input" value={config.levelUpMessage} onChange={e => setConfig({ ...config, levelUpMessage: e.target.value })} rows={2} />
                <p className="form-hint">Variables: {'{user}'}, {'{level}'}</p>
              </div>
            </div>
          </div>

          {/* Recompensas (Roles) */}
          <div className="card">
            <div className="card-header"><h3>🎁 Roles por Nivel</h3></div>
            <div className="card-body">
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <input type="number" min="1" className="form-input" placeholder="Nivel (ej: 5)" value={newLevel} onChange={e => setNewLevel(e.target.value)} style={{ width: 140 }} />
                <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="">Selecciona un Rol...</option>
                  {roles.map(r => <option key={r.id} value={r.id} style={{ color: r.color !== '#000000' ? r.color : undefined }}>{r.name}</option>)}
                </select>
                <button className="btn btn-primary" onClick={addReward}>Añadir</button>
              </div>

              {config.roleRewards.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>Sin recompensas configuradas</div>
              ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 8 }}>Nivel</th>
                      <th style={{ padding: 8 }}>Rol a Dar</th>
                      <th style={{ padding: 8 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.roleRewards.map(r => {
                      const roleObj = roles.find(ro => ro.id === r.roleId)
                      return (
                        <tr key={r.level} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 8, fontWeight: 'bold' }}>Lv. {r.level}</td>
                          <td style={{ padding: 8 }}>{roleObj ? <span style={{ color: roleObj.color }}>{roleObj.name}</span> : r.roleId}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => removeReward(r.level)}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3>🏆 Leaderboard Top 20</h3>
              <button className="btn btn-ghost btn-sm" onClick={simulateXp}>🧪 Simular +100 XP (Dev)</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {leaderboard.length === 0 ? (
                <div className="empty-state">Nadie tiene XP todavía</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Usuario</th>
                        <th>Nivel</th>
                        <th>XP Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((u, i) => (
                        <tr key={u._id}>
                          <td>#{i + 1}</td>
                          <td><strong>{u.userName}</strong> <span className="text-muted text-sm">{u.userId}</span></td>
                          <td><span className="badge badge-primary">Lv. {u.level}</span></td>
                          <td>{u.xp} XP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
