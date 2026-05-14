import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ServerSelector() {
  const [serversWithBot, setServersWithBot] = useState([]);
  const [serversWithoutBot, setServersWithoutBot] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info first
    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => setUser(data))
      .catch(() => {});

    // Get servers
    fetch('/api/servers')
      .then(res => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(data => {
        setServersWithBot(data.serversWithBot || []);
        setServersWithoutBot(data.serversWithoutBot || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060B]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin neon-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060B] font-body-md text-on-surface flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[#6c04ca]/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Topbar */}
      <header className="h-24 w-full flex justify-between items-center px-[5%] relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center neon-pulse">
            <span className="material-symbols-outlined text-on-primary text-[18px]">terminal</span>
          </div>
          <h1 className="text-[20px] font-headline-lg font-extrabold text-white tracking-tight">Tenancy</h1>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="font-label-md text-[13px] uppercase tracking-widest text-on-surface-variant/60 hover:text-white transition-colors">Contacto</a>
          <a href="#" className="font-label-md text-[13px] uppercase tracking-widest text-on-surface-variant/60 hover:text-white transition-colors">Docs</a>
          <a href="#" className="font-label-md text-[13px] uppercase tracking-widest text-on-surface-variant/60 hover:text-white transition-colors">Ventajas</a>
          <a href="#" className="font-label-md text-[13px] uppercase tracking-widest text-on-surface-variant/60 hover:text-white transition-colors">Invitar Bot</a>
        </nav>

        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant/60 cursor-pointer hover:text-white transition-colors">language</span>
          {user ? (
            <div className="flex items-center gap-3 bg-surface-container px-2 py-1.5 rounded-full border border-outline-variant/10">
              {user.avatar ? (
                 <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User" className="w-8 h-8 rounded-full border border-primary/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                </div>
              )}
              <a href="/auth/logout" className="bg-error/10 hover:bg-error/20 text-error px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ml-1 border border-outline-variant/20">Salir</a>
            </div>
          ) : (
            <a href="/auth/discord" className="bg-primary hover:bg-primary/90 text-[#001f28] px-6 py-2 rounded-full font-bold transition-all neon-pulse shadow-lg shadow-primary/20">Login</a>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-20 mt-12 mb-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
          <span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
          <span className="font-label-md text-[12px] text-primary uppercase tracking-widest font-bold">INFRASTRUCTURE V2.4 IS LIVE</span>
        </div>

        <h2 className="text-[50px] md:text-[80px] font-display-lg font-extrabold text-white leading-[1.1] mb-6">
          Tenancy <span className="text-primary">Bot</span><br />
          Experiencia Elite
        </h2>

        <p className="max-w-2xl text-[18px] text-on-surface-variant/70 leading-relaxed mb-12">
          La solución definitiva que combina resiliencia asíncrona con un dashboard premium. 
          Soporte de servicio garantizado para comunidades que no aceptan menos que la perfección.
        </p>

        <div className="flex items-center gap-4">
          <button onClick={() => document.getElementById('servers').scrollIntoView({ behavior: 'smooth' })} className="bg-primary hover:brightness-110 text-[#001f28] px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all neon-pulse shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Acceder al Panel
          </button>
          <a href="#" className="bg-surface-container hover:bg-surface-variant/80 border border-outline-variant/20 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            Invitar Bot
          </a>
        </div>
      </main>

      {/* Servers Section */}
      <div id="servers" className="relative z-20 max-w-container-max mx-auto w-full px-[5%] pb-32">
        <div className="text-center space-y-4 mb-16">
          <h3 className="font-headline-lg text-[32px] font-extrabold text-white">Selecciona tu Servidor</h3>
          <p className="text-on-surface-variant/60">Elige la comunidad que deseas administrar hoy.</p>
        </div>

        {serversWithBot.length > 0 && (
          <section className="space-y-6 mb-16">
            <h4 className="font-label-md text-[14px] uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-3">Servidores Activos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {serversWithBot.map(server => (
                <Link 
                  key={server.id} 
                  to={`/dashboard/${server.id}`}
                  className="glass-card p-6 rounded-2xl flex flex-col items-center gap-5 hover:border-primary/50 hover:bg-white/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src={server.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={server.name} className="w-20 h-20 rounded-full border-2 border-outline-variant/20 group-hover:border-primary transition-colors shadow-lg group-hover:shadow-[0_0_15px_rgba(0,210,255,0.3)]" />
                  <h5 className="font-bold text-center text-[16px] truncate w-full text-white">{server.name}</h5>
                  <span className="text-[12px] bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold border border-primary/20 group-hover:bg-primary group-hover:text-[#001f28] transition-colors w-full text-center">Administrar</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {serversWithoutBot.length > 0 && (
          <section className="space-y-6">
            <h4 className="font-label-md text-[14px] uppercase tracking-widest text-on-surface-variant/40 font-bold border-b border-outline-variant/10 pb-3">Invitar Bot</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {serversWithoutBot.map(server => (
                <a 
                  key={server.id} 
                  href={`https://discord.com/api/oauth2/authorize?client_id=1073809659351076934&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}`}
                  className="glass-card p-6 rounded-2xl flex flex-col items-center gap-5 opacity-60 hover:opacity-100 transition-all border-dashed border-outline-variant/30 hover:border-outline-variant/60"
                >
                  <img src={server.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={server.name} className="w-16 h-16 rounded-full grayscale border border-outline-variant/20" />
                  <h5 className="font-bold text-center text-[14px] truncate w-full text-on-surface-variant/80">{server.name}</h5>
                  <span className="text-[12px] bg-surface-variant/30 text-white px-4 py-1.5 rounded-full border border-outline-variant/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">add</span> Invitar
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
