import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Logs() {
  const { serverData } = useOutletContext();
  
  // We'll mock logs if the API doesn't have it yet
  const logs = serverData?.ticketLogs || [];

  return (
    <div className="space-y-stack-lg flex flex-col h-full">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-headline-lg">history</span>
          <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight uppercase">Bitácora de Tickets</h2>
        </div>
        <p className="font-label-md text-on-surface-variant/60">Historial completo de tickets cerrados y transcripciones.</p>
      </section>

      <section className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant/10 flex gap-4">
          <div className="bg-surface-variant/30 rounded-lg flex items-center px-4 py-2 border border-outline-variant/10 flex-1 max-w-md">
            <span className="material-symbols-outlined text-on-surface-variant/60 mr-2">search</span>
            <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface w-full font-label-md" placeholder="Buscar por usuario o ID..." type="text" />
          </div>
          <button className="bg-surface-variant/30 border border-outline-variant/10 px-4 py-2 rounded-lg text-on-surface hover:bg-white/5 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high/30 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Ticket ID</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Usuario</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Atendido Por</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Fecha Cierre</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">inbox</span>
                    <p>No hay registros de tickets cerrados aún.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    {/* Log rows will go here once API provides them */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
