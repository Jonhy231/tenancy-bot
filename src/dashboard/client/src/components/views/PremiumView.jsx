import { useState, useEffect } from 'react'
import { useToast } from '../ui/UI'
import { api } from '../../api'

export default function PremiumView({ guildId }) {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServer(guildId)
      .then(srv => setConfig({
        isPremium: srv.config.isPremium,
        monthlyTicketsUsed: srv.config.monthlyTicketsUsed || 0,
      }))
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [guildId])

  if (loading || !config) return <div className="loading-state"><div className="spinner" /></div>

  const isPremium = config.isPremium
  const usagePct = Math.min((config.monthlyTicketsUsed / 50) * 100, 100)

  return (
    <div>
      <div className="view-header">
        <h1>⭐ Tenancy Premium</h1>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* Estado Actual */}
        <div className="card" style={{ border: isPremium ? '2px solid #ff6ef7' : '1px solid var(--border)', background: isPremium ? 'rgba(255,110,247,0.05)' : 'var(--bg-secondary)' }}>
          <div className="card-header">
            <h3 style={{ color: isPremium ? '#ff6ef7' : 'inherit' }}>
              {isPremium ? '⭐ Tu servidor es Premium' : 'Estado: Plan Gratuito'}
            </h3>
          </div>
          <div className="card-body">
            {!isPremium ? (
              <>
                <p className="text-muted" style={{ marginBottom: 20 }}>
                  Actualmente estás en el plan gratuito. Tienes un límite de 50 tickets por mes. El contador se reinicia automáticamente cada primero de mes.
                </p>

                <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Consumo Mensual</strong>
                    <strong style={{ color: config.monthlyTicketsUsed >= 50 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {config.monthlyTicketsUsed} / 50 Tickets
                    </strong>
                  </div>
                  <div style={{ height: 10, background: 'var(--bg-hover)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${usagePct}%`, 
                      height: '100%', 
                      background: config.monthlyTicketsUsed >= 50 ? 'var(--danger)' : config.monthlyTicketsUsed >= 40 ? 'var(--warning)' : 'var(--success)',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  {config.monthlyTicketsUsed >= 50 && (
                    <p className="text-sm text-danger" style={{ marginTop: 8 }}>
                      ⚠️ Has alcanzado el límite. No se podrán crear más tickets hasta el próximo mes o hasta actualizar a Premium.
                    </p>
                  )}
                </div>

                <a href="https://discord.gg/tu-servidor-de-soporte" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #ff6ef7 0%, #b845ff 100%)', border: 'none' }}>
                  ⭐ Obtener Premium Ilimitado
                </a>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: 16 }}>🚀</div>
                  <h2 style={{ marginBottom: 8 }}>¡Gracias por tu apoyo!</h2>
                  <p className="text-muted">
                    Disfrutas de tickets ilimitados y acceso completo a todas las características actuales y futuras de Tenancy.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Comparativa */}
        <div className="card">
          <div className="card-header"><h3>Comparativa de Planes</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: 16, textAlign: 'left' }}>Característica</th>
                  <th style={{ padding: 16 }}>Free</th>
                  <th style={{ padding: 16, color: '#ff6ef7' }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Límite de Tickets', f: '50/mes', p: '∞ Ilimitado' },
                  { name: 'Categorías de Tickets', f: 'Ilimitadas', p: 'Ilimitadas' },
                  { name: 'Modo Custom Panel', f: '✅', p: '✅' },
                  { name: 'Sistema de Moderación', f: '✅', p: '✅' },
                  { name: 'Sistema de Niveles', f: '✅', p: '✅' },
                  { name: 'Aplicaciones de Staff', f: '✅', p: '✅' },
                  { name: 'Transcripciones Cloud', f: 'Próximamente', p: '✅ Prioridad' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 16, textAlign: 'left', fontWeight: 500 }}>{row.name}</td>
                    <td style={{ padding: 16, color: 'var(--text-muted)' }}>{row.f}</td>
                    <td style={{ padding: 16, fontWeight: 600, color: '#ff6ef7' }}>{row.p}</td>
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
