import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const NAV = [
  { section: 'GENERAL' },
  { id: 'overview',  label: 'Overview',    icon: '📊', path: 'overview' },
  { section: 'TICKETS' },
  { id: 'tickets',   label: 'Configuración', icon: '🎫', path: 'tickets' },
  { id: 'logs',      label: 'Ticket Logs',  icon: '📋', path: 'logs' },
  { section: 'SERVIDOR' },
  { id: 'moderation',label: 'Moderación',   icon: '🛡️', path: 'moderation' },
  { id: 'levels',    label: 'Levels',       icon: '📈', path: 'levels' },
  { section: 'EXTRAS' },
  { id: 'faq',       label: 'FAQ Panels',   icon: '❓', path: 'faq' },
  { id: 'autoresponse', label: 'Auto Responses', icon: '🤖', path: 'autoresponse' },
  { id: 'polls',     label: 'Polls',        icon: '📊', path: 'polls' },
  { id: 'verification', label: 'Verification', icon: '🔒', path: 'verification' },
  { section: 'PREMIUM' },
  { id: 'premium',   label: 'Premium',      icon: '⭐', path: 'premium' },
]

export default function Sidebar({ guildId, isDev }) {
  const [collapsed, setCollapsed] = useState(false)
  const base = `/server/${guildId}`

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Toggle */}
      <div style={{ padding: '12px 8px 4px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expandir' : 'Contraer'}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {NAV.map((item, i) => {
        if (item.section) {
          return <div key={i} className="sidebar-section-label">{item.section}</div>
        }
        return (
          <NavLink
            key={item.id}
            to={`${base}/${item.path}`}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        )
      })}

      {isDev && (
        <>
          <div className="sidebar-section-label">DEV</div>
          <NavLink to={`${base}/dev`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ color: '#ff6ef7' }}>
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Dev Terminal</span>
          </NavLink>
        </>
      )}
    </aside>
  )
}
