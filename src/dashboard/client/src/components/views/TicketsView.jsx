import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useToast, Modal, Spinner } from '../ui/UI'

/* ── Colores Discord para botones ── */
const BTN_COLORS = [
  { id: 'primary',   label: 'Blurple', hex: '#5865f2' },
  { id: 'success',   label: 'Verde',   hex: '#3ba55c' },
  { id: 'danger',    label: 'Rojo',    hex: '#ed4245' },
  { id: 'secondary', label: 'Gris',    hex: '#4f545c' },
]

/* ─────────────────────────────────────────
   DISCORD PREVIEW — Contact System Style
───────────────────────────────────────── */
function ContactPreview({ panel, buttons }) {
  const descField = buttons
    .filter(b => b.description)
    .map(b => `**${b.label}:** ${b.description}`)
    .join('\n')

  return (
    <div className="discord-preview">
      <div className="discord-msg">
        <div className="discord-avatar">T</div>
        <div className="discord-msg-body">
          <div className="discord-username">
            Tenancy <span>BOT Hoy a las 12:00</span>
          </div>
          <div className="discord-embed" style={{ borderLeftColor: panel.color || '#5865f2' }}>
            {panel.banner && (
              <img src={panel.banner} className="discord-embed-banner" alt="banner" onError={e => e.target.style.display='none'} />
            )}
            <div className="discord-embed-body">
              {panel.title && <div className="discord-embed-title">{panel.title}</div>}
              {panel.description && <div className="discord-embed-desc">{panel.description}</div>}
              {descField && (
                <div style={{ marginTop: 8 }}>
                  <div className="discord-embed-field-name">DESCRIPCIÓN</div>
                  <div className="discord-embed-field-value">
                    {buttons.filter(b => b.description).map(b => (
                      <div key={b.id}><strong>{b.label}:</strong> {b.description}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {buttons.length > 0 && (
              <div className="discord-buttons">
                {buttons.map(b => {
                  const col = BTN_COLORS.find(c => c.id === b.color) || BTN_COLORS[0]
                  return (
                    <button key={b.id} className={`discord-btn ${b.color || 'primary'}`}>
                      {b.emoji && <span>{b.emoji}</span>}
                      {b.label || 'Botón'}
                    </button>
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

/* ─────────────────────────────────────────
   DISCORD PREVIEW — Classic Select Style
───────────────────────────────────────── */
function ClassicPreview({ embed, categories }) {
  return (
    <div className="discord-preview">
      <div className="discord-msg">
        <div className="discord-avatar">T</div>
        <div className="discord-msg-body">
          <div className="discord-username">Tenancy <span>BOT Hoy a las 12:00</span></div>
          <div className="discord-embed" style={{ borderLeftColor: embed?.color || '#5865f2' }}>
            {embed?.image && (
              <img src={embed.image} className="discord-embed-banner" alt="" onError={e => e.target.style.display='none'} />
            )}
            <div className="discord-embed-body">
              <div className="discord-embed-title">{embed?.title || '🎫 Sistema de Tickets'}</div>
              <div className="discord-embed-desc">{embed?.description || 'Selecciona una categoría para abrir un ticket.'}</div>
              {embed?.footer && <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#72767d' }}>{embed.footer}</div>}
            </div>
          </div>
          <div className="discord-select">
            <span style={{ color: '#72767d' }}>
              {categories.length > 0
                ? `${categories[0].emoji || '📂'} Selecciona una categoría...`
                : '📂 Selecciona una categoría...'}
            </span>
            <span>▾</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   PANEL BUILDER — Modo Personalizado
───────────────────────────────────────── */
function CustomPanelBuilder({ guildId, config, onSaved, channels, categories }) {
  const toast = useToast()
  const [panel, setPanel] = useState({
    banner: config?.customPanel?.banner || '',
    title: config?.customPanel?.title || 'Contact System',
    description: config?.customPanel?.description || 'Selecciona una opción para abrir un ticket.',
    color: config?.customPanel?.color || '#5865f2',
  })
  const [buttons, setButtons] = useState(config?.customPanel?.buttons || [])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [panelChannel, setPanelChannel] = useState(config?.panelChannelId || '')

  const addButton = () => {
    if (buttons.length >= 25) return toast('Máximo 25 botones', 'error')
    setButtons(b => [...b, {
      id: `btn_${Date.now()}`,
      label: `Opción ${b.length + 1}`,
      emoji: '🎫',
      color: 'primary',
      description: '',
      categoryId: categories?.[0]?.id || '',
    }])
  }

  const updateButton = (idx, field, val) => {
    setButtons(b => b.map((btn, i) => i === idx ? { ...btn, [field]: val } : btn))
  }

  const removeButton = (idx) => setButtons(b => b.filter((_, i) => i !== idx))

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, {
        ticketMode: 'custom',
        customPanel: { ...panel, buttons },
        panelChannelId: panelChannel,
      })
      toast('Panel personalizado guardado', 'success')
      onSaved?.()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const sendPanel = async () => {
    if (!panelChannel) return toast('Selecciona un canal para el panel', 'error')
    if (buttons.length === 0) return toast('Añade al menos un botón', 'error')
    setSending(true)
    try {
      await api.post(`/api/server/${guildId}/panel/send`, {})
      toast('✅ Panel enviado en Discord', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  const textChannels = channels?.textChannels || []

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      {/* Editor */}
      <div className="section-gap">
        {/* Embed config */}
        <div className="card">
          <div className="card-header"><h3>🖼️ Embed del Panel</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">URL de Banner/Logo</label>
              <input className="form-input" placeholder="https://i.imgur.com/..." value={panel.banner} onChange={e => setPanel(p => ({ ...p, banner: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={panel.title} onChange={e => setPanel(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" rows={3} value={panel.description} onChange={e => setPanel(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color del borde</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={panel.color} onChange={e => setPanel(p => ({ ...p, color: e.target.value }))} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                <input className="form-input" value={panel.color} onChange={e => setPanel(p => ({ ...p, color: e.target.value }))} style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons builder */}
        <div className="card">
          <div className="card-header">
            <h3>🔘 Botones ({buttons.length}/25)</h3>
            <button className="btn btn-primary btn-sm" onClick={addButton}>+ Añadir</button>
          </div>
          <div className="card-body">
            {buttons.length === 0 && (
              <div className="empty-state"><div className="empty-icon">🔘</div><p>Añade botones para el panel</p></div>
            )}
            <div className="btn-list">
              {buttons.map((btn, idx) => (
                <div key={btn.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px auto', gap: 10, alignItems: 'center' }}>
                    <div>
                      <label className="form-label">Emoji</label>
                      <input className="form-input" value={btn.emoji} onChange={e => updateButton(idx, 'emoji', e.target.value)} maxLength={8} />
                    </div>
                    <div>
                      <label className="form-label">Etiqueta</label>
                      <input className="form-input" value={btn.label} onChange={e => updateButton(idx, 'label', e.target.value)} maxLength={80} />
                    </div>
                    <div>
                      <label className="form-label">Color</label>
                      <select className="form-input" value={btn.color} onChange={e => updateButton(idx, 'color', e.target.value)}>
                        {BTN_COLORS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-danger btn-sm" style={{ marginTop: 22 }} onClick={() => removeButton(idx)}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="form-label">Descripción (opcional)</label>
                      <input className="form-input" placeholder="Explica para qué sirve este botón..." value={btn.description} onChange={e => updateButton(idx, 'description', e.target.value)} maxLength={150} />
                    </div>
                    <div>
                      <label className="form-label">Categoría vinculada</label>
                      <select className="form-input" value={btn.categoryId} onChange={e => updateButton(idx, 'categoryId', e.target.value)}>
                        <option value="">— Sin categoría —</option>
                        {(categories || []).map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Send config */}
        <div className="card">
          <div className="card-header"><h3>📤 Publicar Panel</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Canal del panel</label>
              <select className="form-input" value={panelChannel} onChange={e => setPanelChannel(e.target.value)}>
                <option value="">Seleccionar canal...</option>
                {textChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><Spinner size="sm" /> Guardando...</> : '💾 Guardar Cambios'}
              </button>
              <button className="btn btn-success" onClick={sendPanel} disabled={sending}>
                {sending ? <><Spinner size="sm" /> Enviando...</> : '🚀 Enviar en Discord'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="card">
          <div className="card-header"><h3>👁️ Vista Previa</h3></div>
          <div className="card-body">
            <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Así se verá en Discord:</p>
            <ContactPreview panel={panel} buttons={buttons} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CLASSIC MODE — Category manager + embed
───────────────────────────────────────── */
function ClassicPanelBuilder({ guildId, config, onSaved, channels, categories: initCats }) {
  const toast = useToast()
  const [categories, setCategories] = useState(initCats || [])
  const [embed, setEmbed] = useState({
    title: config?.panelEmbed?.title || '🎫 Sistema de Tickets',
    description: config?.panelEmbed?.description || 'Selecciona una categoría para abrir un ticket.',
    color: config?.panelEmbed?.color || '#5865f2',
    image: config?.panelEmbed?.image || '',
    thumbnail: config?.panelEmbed?.thumbnail || '',
    footer: config?.panelEmbed?.footer || 'Powered by Tenancy',
    fields: config?.panelEmbed?.fields || [],
  })
  const [panelChannel, setPanelChannel] = useState(config?.panelChannelId || '')
  const [greeting, setGreeting] = useState(config?.ticketGreeting || '¡Hola {user}! 👋 Gracias por abrir un ticket.')
  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', emoji: '🎫', description: '' })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const textChannels = channels?.textChannels || []

  const addCategory = async () => {
    if (!catForm.name.trim()) return toast('El nombre es obligatorio', 'error')
    try {
      const { category } = await api.addCategory(guildId, catForm)
      setCategories(c => [...c, category])
      setCatForm({ name: '', emoji: '🎫', description: '' })
      setShowCatModal(false)
      toast('Categoría añadida', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const deleteCategory = async (catId) => {
    try {
      await api.deleteCategory(guildId, catId)
      setCategories(c => c.filter(x => x.id !== catId))
      toast('Categoría eliminada', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.updateConfig(guildId, {
        ticketMode: 'classic',
        panelEmbed: embed,
        ticketGreeting: greeting,
        panelChannelId: panelChannel,
      })
      toast('Configuración guardada', 'success')
      onSaved?.()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const sendPanel = async () => {
    if (!panelChannel) return toast('Selecciona un canal para el panel', 'error')
    if (categories.length === 0) return toast('Crea al menos una categoría', 'error')
    setSending(true)
    try {
      await api.sendPanel(guildId)
      toast('✅ Panel enviado en Discord', 'success')
    } catch (e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  return (
    <>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Editor */}
        <div className="section-gap">
          {/* Embed */}
          <div className="card">
            <div className="card-header"><h3>🎨 Diseño del Embed</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={embed.title} onChange={e => setEmbed(em => ({ ...em, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={embed.description} onChange={e => setEmbed(em => ({ ...em, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={embed.color} onChange={e => setEmbed(em => ({ ...em, color: e.target.value }))} style={{ width: 40, height: 36, border: 'none', borderRadius: 6 }} />
                    <input className="form-input" value={embed.color} onChange={e => setEmbed(em => ({ ...em, color: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Footer</label>
                  <input className="form-input" value={embed.footer} onChange={e => setEmbed(em => ({ ...em, footer: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">URL de Imagen (banner)</label>
                <input className="form-input" placeholder="https://..." value={embed.image} onChange={e => setEmbed(em => ({ ...em, image: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje de bienvenida al ticket</label>
                <textarea className="form-input" rows={2} value={greeting} onChange={e => setGreeting(e.target.value)} />
                <p className="form-hint">Variables: {'{user}'}, {'{subject}'}, {'{category}'}</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="card">
            <div className="card-header">
              <h3>🏷️ Categorías ({categories.length})</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCatModal(true)}>+ Añadir</button>
            </div>
            <div className="card-body">
              {categories.length === 0 && (
                <div className="empty-state"><div className="empty-icon">🏷️</div><p>Sin categorías</p></div>
              )}
              <div className="cat-list">
                {categories.map(cat => (
                  <div key={cat.id} className="cat-item">
                    <span className="cat-emoji">{cat.emoji}</span>
                    <div className="cat-info">
                      <div className="cat-name">{cat.name}</div>
                      <div className="cat-desc">{cat.description}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(cat.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Send */}
          <div className="card">
            <div className="card-header"><h3>📤 Publicar Panel</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Canal del panel</label>
                <select className="form-input" value={panelChannel} onChange={e => setPanelChannel(e.target.value)}>
                  <option value="">Seleccionar canal...</option>
                  {textChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <><Spinner size="sm" /> Guardando...</> : '💾 Guardar'}
                </button>
                <button className="btn btn-success" onClick={sendPanel} disabled={sending}>
                  {sending ? <><Spinner size="sm" /> Enviando...</> : '🚀 Enviar en Discord'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card">
          <div className="card-header"><h3>👁️ Vista Previa</h3></div>
          <div className="card-body">
            <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Así se verá en Discord:</p>
            <ClassicPreview embed={embed} categories={categories} />
          </div>
        </div>
      </div>

      {/* Modal: nueva categoría */}
      {showCatModal && (
        <Modal
          title="🏷️ Nueva Categoría"
          onClose={() => setShowCatModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowCatModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={addCategory}>Guardar</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" placeholder="Soporte General" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Emoji</label>
            <input className="form-input" placeholder="🎫" maxLength={4} value={catForm.emoji} onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Ayuda general del servidor" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  )
}

/* ─────────────────────────────────────────
   MAIN VIEW — Selector de modo + builder
───────────────────────────────────────── */
export default function TicketsView({ guildId }) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState(null)
  const [channels, setChannels] = useState(null)
  const [mode, setMode] = useState('classic')

  useEffect(() => {
    if (!guildId) return
    setLoading(true)
    Promise.all([api.getServer(guildId), api.getChannels(guildId)])
      .then(([srv, ch]) => {
        setConfig(srv.config)
        setChannels(ch)
        setMode(srv.config?.ticketMode || 'classic')
      })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  const switchMode = async (newMode) => {
    setMode(newMode)
    try {
      await api.updateConfig(guildId, { ticketMode: newMode })
      toast(`Modo cambiado a ${newMode === 'classic' ? 'Clásico' : 'Personalizado'}`, 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>

  return (
    <div>
      <div className="view-header">
        <h1>🎫 Sistema de Tickets</h1>
        <p>Configura cómo los usuarios abren tickets en tu servidor</p>
      </div>

      {/* Mode Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <p className="form-label" style={{ marginBottom: 12 }}>Modo del panel de tickets</p>
          <div className="mode-toggle" style={{ maxWidth: 480 }}>
            <button className={`mode-btn${mode === 'classic' ? ' active' : ''}`} onClick={() => switchMode('classic')}>
              📋 Clásico (Menú desplegable)
            </button>
            <button className={`mode-btn${mode === 'custom' ? ' active' : ''}`} onClick={() => switchMode('custom')}>
              🎨 Personalizado (Botones)
            </button>
          </div>
          <p className="form-hint" style={{ marginTop: 10 }}>
            {mode === 'classic'
              ? 'El usuario elige una categoría en un menú desplegable (select menu de Discord).'
              : 'Panel tipo "Contact System" con botones de colores, imágenes y descripciones personalizadas.'}
          </p>
        </div>
      </div>

      {/* Builder */}
      {mode === 'classic' ? (
        <ClassicPanelBuilder
          guildId={guildId}
          config={config}
          channels={channels}
          categories={config?.categories || []}
          onSaved={() => {}}
        />
      ) : (
        <CustomPanelBuilder
          guildId={guildId}
          config={config}
          channels={channels}
          categories={config?.categories || []}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}
