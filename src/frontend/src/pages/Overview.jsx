import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Overview() {
  const { serverData } = useOutletContext();

  const stats = serverData?.stats || {
    openTickets: 0,
    closedTickets: 0,
    totalTickets: 0,
    categories: 0
  };

  const recentTickets = serverData?.recentTickets || [];

  return (
    <div className="space-y-stack-lg">
      {/* Dashboard Header */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-headline-lg">monitoring</span>
          <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight uppercase">Vista General</h2>
        </div>
        <p className="font-label-md text-on-surface-variant/60">{serverData?.guild?.name}</p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-50"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-display-lg text-display-lg text-primary">{stats.totalTickets}</span>
            <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">confirmation_number</span>
          </div>
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant/60">Total Tickets</h3>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group border-primary/20 bg-primary/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-transparent"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-display-lg text-display-lg text-primary-container">{stats.openTickets}</span>
            <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">folder_open</span>
          </div>
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant/60">Tickets Abiertos</h3>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error to-transparent opacity-30"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-display-lg text-display-lg text-on-surface">{stats.closedTickets}</span>
            <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">lock_clock</span>
          </div>
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant/60">Tickets Cerrados</h3>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent opacity-30"></div>
          <div className="flex justify-between items-start mb-6">
            <span className="font-display-lg text-display-lg text-secondary">{stats.categories}</span>
            <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">account_tree</span>
          </div>
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant/60">Categorías</h3>
        </div>
      </div>

      {/* Main Activity Table Section */}
      <section className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant/60">history</span>
          <h2 className="font-headline-md text-[18px] font-bold uppercase tracking-widest text-on-surface">Tickets Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high/30">
              <tr>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">#</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Usuario</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Categoría</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Asunto</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Estado</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-8 text-center text-on-surface-variant/40">No hay tickets recientes</td>
                </tr>
              ) : (
                recentTickets.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5 font-label-md text-on-surface-variant/60">#{String(ticket.ticketNumber).padStart(4, '0')}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-on-surface">{ticket.userName || 'Usuario'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-label-md text-on-surface-variant/80">{ticket.categoryName}</td>
                    <td className="px-8 py-5 font-label-md text-on-surface-variant/60 truncate max-w-[150px]">{ticket.subject}</td>
                    <td className="px-8 py-5">
                      {ticket.status === 'closed' ? (
                        <span className="inline-block px-3 py-1 rounded-full bg-on-tertiary-container/20 text-on-tertiary-container font-label-md text-[10px] uppercase font-bold border border-on-tertiary-container/30">Cerrado</span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-label-md text-[10px] uppercase font-bold border border-primary/30">Abierto</span>
                      )}
                    </td>
                    <td className="px-8 py-5 font-label-md text-on-surface-variant/40 text-[12px]">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Visual Accent */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter pb-stack-lg">
        <div className="glass-card p-8 rounded-2xl flex items-center justify-between group overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Bot Infrastructure Status</h4>
            <div className="flex items-center gap-2 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="font-label-md text-label-md font-bold uppercase tracking-widest">Global Status: Online</span>
            </div>
          </div>
          <div className="opacity-10 absolute -right-10 top-0 text-[180px] pointer-events-none transform group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined">settings_input_component</span>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden min-h-[160px] glass-card flex flex-col justify-end p-8 border-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
          {/* We replace the massive data URL from HTML with a subtle gradient/pattern to avoid large file sizes */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-30"></div>
          <div className="relative z-20">
            <h4 className="font-headline-md text-headline-md text-secondary mb-2">Advanced Analytics</h4>
            <p className="font-label-md text-on-surface-variant/60">New monitoring metrics available in v2.4</p>
          </div>
        </div>
      </section>
    </div>
  );
}
