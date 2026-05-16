import { useState, useCallback, createContext, useContext, useRef } from 'react'

/* ─── Toast ─── */
const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/* ─── Spinner ─── */
export function Spinner({ size = 'md' }) {
  return <div className={size === 'sm' ? 'spinner-sm' : 'spinner'} />
}

/* ─── Loading Screen ─── */
export function LoadingScreen({ text = 'Cargando...' }) {
  return (
    <div className="loading-screen">
      <Spinner />
      <p className="text-muted text-sm">{text}</p>
    </div>
  )
}

/* ─── Modal ─── */
export function Modal({ title, children, footer, onClose, maxWidth = 500 }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

/* ─── Tag input (multi-select) ─── */
export function TagSelect({ values = [], options = [], onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="tags-wrap">
        {values.map(id => {
          const opt = options.find(o => o.id === id)
          if (!opt) return null
          return (
            <span key={id} className="tag">
              {opt.name}
              <button className="tag-remove" onClick={() => onChange(values.filter(v => v !== id))}>×</button>
            </span>
          )
        })}
      </div>
      <select className="form-input" value="" onChange={e => { if (e.target.value && !values.includes(e.target.value)) onChange([...values, e.target.value]) }}>
        <option value="">{placeholder || '+ Añadir...'}</option>
        {options.filter(o => !values.includes(o.id)).map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  )
}
