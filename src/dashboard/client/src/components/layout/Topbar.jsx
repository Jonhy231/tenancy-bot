import { useAuth } from '../../contexts/AuthContext'

export default function Topbar({ servers, currentGuild, onServerChange }) {
  const { user } = useAuth()
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null

  return (
    <header className="topbar">
      <div className="topbar-brand">
        Ten<span className="accent">ancy</span>
      </div>

      <div className="topbar-center">
        {servers?.length > 0 && (
          <select
            className="server-selector"
            value={currentGuild || ''}
            onChange={e => onServerChange?.(e.target.value)}
          >
            <option value="" disabled>Seleccionar servidor...</option>
            {servers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="topbar-right">
        <div className="user-pill">
          {avatarUrl
            ? <img src={avatarUrl} className="user-avatar" alt={user.username} />
            : <div className="user-avatar" style={{ background: '#5865f2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:'0.8rem' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
          }
          <span className="user-name">{user?.username}</span>
        </div>
        <a href="/auth/logout" className="btn btn-ghost btn-sm">Salir</a>
      </div>
    </header>
  )
}
