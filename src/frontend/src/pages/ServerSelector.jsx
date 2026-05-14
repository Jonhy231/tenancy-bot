import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ServerSelector() {
  const [serversWithBot, setServersWithBot] = useState([]);
  const [serversWithoutBot, setServersWithoutBot] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/servers')
      .then(res => res.json())
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="font-headline-lg text-[32px] font-extrabold text-primary">Selecciona un Servidor</h1>
          <p className="text-on-surface-variant/60">Elige el servidor que deseas configurar.</p>
        </div>

        {serversWithBot.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline-md text-[20px] font-bold text-on-surface border-b border-outline-variant/10 pb-2">Servidores Activos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serversWithBot.map(server => (
                <Link 
                  key={server.id} 
                  to={`/dashboard/${server.id}`}
                  className="glass-card p-6 rounded-2xl flex flex-col items-center gap-4 hover:brightness-110 hover:scale-105 transition-all group"
                >
                  <img src={server.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={server.name} className="w-20 h-20 rounded-full border border-outline-variant/20 group-hover:border-primary transition-colors" />
                  <h3 className="font-bold text-center text-[16px] truncate w-full">{server.name}</h3>
                  <span className="text-[12px] bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">Ir al Dashboard</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {serversWithoutBot.length > 0 && (
          <section className="space-y-4 pt-8">
            <h2 className="font-headline-md text-[20px] font-bold text-on-surface border-b border-outline-variant/10 pb-2">Invitar Bot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serversWithoutBot.map(server => (
                <a 
                  key={server.id} 
                  href={`https://discord.com/api/oauth2/authorize?client_id=1073809659351076934&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}`}
                  className="glass-card p-6 rounded-2xl flex flex-col items-center gap-4 opacity-70 hover:opacity-100 hover:scale-105 transition-all"
                >
                  <img src={server.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={server.name} className="w-16 h-16 rounded-full border border-outline-variant/20 grayscale" />
                  <h3 className="font-bold text-center text-[14px] truncate w-full text-on-surface-variant/80">{server.name}</h3>
                  <span className="text-[12px] bg-surface-variant/30 text-on-surface px-3 py-1 rounded-full border border-outline-variant/20">Invitar Bot</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
