import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '', name: 'Overview', icon: 'monitoring' },
  { path: 'tickets', name: 'Tickets', icon: 'confirmation_number' },
  { path: 'moderation', name: 'Moderation', icon: 'admin_panel_settings' },
  { path: 'logs', name: 'Logs', icon: 'history' },
  { path: 'levels', name: 'Levels', icon: 'military_tech' },
  // { path: 'premium', name: 'Premium', icon: 'workspace_premium', highlight: true }, // Disabled per user request
];

export default function Sidebar({ guildId }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-surface-container dark:bg-surface-container-low/50 backdrop-blur-2xl border-r border-outline-variant/10 shadow-2xl flex flex-col py-8 px-4 z-40 transition-transform md:translate-x-0 -translate-x-full">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center neon-pulse">
          <span className="material-symbols-outlined text-on-primary">terminal</span>
        </div>
        <div>
          <h1 className="text-headline-md font-headline-md text-primary leading-tight">Tenancy</h1>
          <p className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant/40">Infrastructure v2.4</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const toPath = `/dashboard/${guildId}${item.path ? `/${item.path}` : ''}`;
          
          return (
            <NavLink
              key={item.name}
              to={toPath}
              end={item.path === ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/10 text-on-surface font-bold border-l-4 border-primary shadow-[0_0_15px_rgba(0,210,255,0.3)] translate-x-1'
                    : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined group-hover:translate-x-1 duration-200">
                {item.icon}
              </span>
              <span className={`font-label-md text-label-md ${item.highlight ? 'text-secondary' : ''}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-6">
        <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary font-bold shadow-lg hover:brightness-110 hover:shadow-cyan-500/20 transition-all active:scale-95">
          Upgrade to Pro
        </button>
        <div className="space-y-1">
          <a className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5 transition-colors" href="/dashboard.html">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-label-md text-label-md">Server List</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
