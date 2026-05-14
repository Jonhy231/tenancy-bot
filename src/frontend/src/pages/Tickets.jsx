import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Tickets() {
  const { serverData } = useOutletContext();
  const [tickets] = useState([
    { id: 'TK-8942', user: 'Alex#0001', category: 'SOPORTE TÉCNICO', subject: 'Error en la integra...', status: 'ABIERTO', date: 'Hace 12 min' },
    { id: 'TK-8941', user: 'Kyra.dev', category: 'FACTURACIÓN', subject: 'Renovación de Plan...', status: 'RECLAMADO', date: 'Hace 45 min' },
    { id: 'TK-8939', user: 'Matrix_Mod', category: 'REPORTE', subject: 'Usuario infringiend...', status: 'PENDIENTE', date: 'Hace 2 horas' },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pt-4">
      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-variant/30 flex items-center justify-center border border-outline-variant/20 shadow-lg">
            <span className="material-symbols-outlined text-white text-[24px]">confirmation_number</span>
          </div>
          <div>
            <h2 className="text-[32px] font-headline-lg font-extrabold text-white tracking-tight uppercase leading-tight">Gestión de Tickets</h2>
            <p className="font-label-md text-[13px] text-on-surface-variant/60">Infrastructure Management / Support System v2.4</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="bg-surface-variant/30 hover:bg-surface-variant/50 border border-outline-variant/20 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Configuración
          </button>
          <button className="bg-gradient-to-r from-primary-container to-secondary-container text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all neon-pulse hover:brightness-110 active:scale-95 shadow-lg">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo Ticket
          </button>
        </div>
      </section>

      {/* Top Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="bg-primary/20 border border-primary/30 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
              <span className="font-bold text-[14px] text-primary">Abiertos (4)</span>
            </div>
            <div className="bg-surface-variant/30 border border-outline-variant/10 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/50"></div>
              <span className="font-bold text-[14px] text-on-surface-variant/60">Cerrados (128)</span>
            </div>
            <div className="bg-error/10 border border-error/20 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
              <span className="font-bold text-[14px] text-error">Baneados (2)</span>
            </div>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
            <input type="text" placeholder="Buscar por usuario, ID o categoría..." className="w-full bg-[#05060B] border border-outline-variant/20 rounded-xl py-3 pl-12 pr-4 text-on-surface font-label-md focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="font-label-md text-[12px] uppercase tracking-widest text-primary font-bold">RESPONSE RATE</h3>
            <span className="text-[12px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">+12%</span>
          </div>
          <div className="text-[48px] font-display-lg font-extrabold text-white leading-none mb-4 relative z-10">94.2%</div>
          <div className="w-full h-1.5 bg-[#05060B] rounded-full mb-3 overflow-hidden relative z-10">
            <div className="h-full bg-primary w-[94.2%] rounded-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"></div>
          </div>
          <p className="font-label-md text-[11px] text-on-surface-variant/50 relative z-10">Calculated from the last 24 hours</p>
        </div>
      </div>

      {/* Main Table */}
      <section className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="font-headline-md text-[20px] font-bold text-white">Tickets Activos</h2>
          <div className="flex gap-4">
            <button className="text-on-surface-variant/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="text-on-surface-variant/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0A0D14]">
              <tr>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold"># ID</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Usuario</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Categoría</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Asunto</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Estado</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Fecha</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-8 py-5 font-label-md text-primary font-bold text-[13px]">{ticket.id}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant/50 border border-outline-variant/20 flex items-center justify-center overflow-hidden">
                        <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-white text-[14px]">{ticket.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-block px-3 py-1 rounded-md font-label-md text-[10px] uppercase font-bold border ${
                      ticket.category === 'SOPORTE TÉCNICO' ? 'bg-primary/10 text-primary border-primary/20' :
                      ticket.category === 'FACTURACIÓN' ? 'bg-[#d9b9ff]/10 text-[#d9b9ff] border-[#d9b9ff]/20' :
                      'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20'
                    }`}>
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-body-md text-on-surface-variant/80 text-[14px]">{ticket.subject}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        ticket.status === 'ABIERTO' ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' :
                        ticket.status === 'RECLAMADO' ? 'bg-primary shadow-[0_0_5px_#a5e7ff]' :
                        'bg-on-surface-variant/40'
                      }`}></div>
                      <span className={`font-label-md text-[11px] uppercase font-bold ${
                        ticket.status === 'ABIERTO' ? 'text-green-400' :
                        ticket.status === 'RECLAMADO' ? 'text-primary' :
                        'text-on-surface-variant/40'
                      }`}>{ticket.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-label-md text-on-surface-variant/50 text-[12px]">{ticket.date}</td>
                  <td className="px-8 py-5">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-on-surface-variant/60 hover:text-white bg-surface-variant/30 px-3 py-1.5 rounded-lg border border-outline-variant/10 font-label-md text-[12px] transition-colors">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-4 border-t border-outline-variant/10 flex justify-between items-center bg-[#0A0D14]">
            <span className="font-label-md text-[12px] text-on-surface-variant/50">Mostrando 3 de 134 tickets</span>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-lg bg-surface-variant/30 flex items-center justify-center border border-outline-variant/10 text-on-surface-variant/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded-lg bg-primary text-[#001f28] font-bold flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg bg-surface-variant/30 flex items-center justify-center border border-outline-variant/10 text-white hover:bg-surface-variant/50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bento Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <span className="material-symbols-outlined">speed</span>
            </div>
            <h4 className="font-bold text-[16px] text-white">Tiempo de Respuesta</h4>
          </div>
          <p className="text-[14px] text-on-surface-variant/70">
            Promedio actual: <span className="text-primary font-bold">14 minutos</span>. Manteniendo el SLA establecido para este trimestre.
          </p>
        </div>
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#d9b9ff]/10 flex items-center justify-center border border-[#d9b9ff]/20 text-[#d9b9ff]">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <h4 className="font-bold text-[16px] text-white">Volumen de Tickets</h4>
          </div>
          <p className="text-[14px] text-on-surface-variant/70">
            Hoy se han generado <span className="text-[#d9b9ff] font-bold">42 tickets</span> nuevos. Una disminución del 5% respecto a ayer.
          </p>
        </div>
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#ffb4ab]/10 flex items-center justify-center border border-[#ffb4ab]/20 text-[#ffb4ab]">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h4 className="font-bold text-[16px] text-white">Satisfacción</h4>
          </div>
          <p className="text-[14px] text-on-surface-variant/70">
            Calificación media de <span className="text-[#ffb4ab] font-bold">4.8/5.0</span> en las encuestas de salida de soporte.
          </p>
        </div>
      </section>
    </div>
  );
}
