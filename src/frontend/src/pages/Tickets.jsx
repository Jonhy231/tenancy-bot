import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Tickets() {
  const { serverData } = useOutletContext();
  const config = serverData?.config || {};

  return (
    <div className="space-y-stack-lg">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-headline-lg">confirmation_number</span>
          <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight uppercase">Gestión de Tickets</h2>
        </div>
        <p className="font-label-md text-on-surface-variant/60">Configura las categorías y paneles de tickets.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Categories Config */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-[18px] text-on-surface font-bold">Categorías Activas</h3>
            <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-[12px] uppercase font-bold hover:brightness-110 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva
            </button>
          </div>
          <div className="space-y-4">
            {config.categories?.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-surface-variant/30 rounded-xl border border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <h4 className="font-bold text-on-surface">{cat.name}</h4>
                    <p className="text-[12px] text-on-surface-variant/60">{cat.description}</p>
                  </div>
                </div>
                <button className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Panel Sender */}
        <section className="glass-card rounded-2xl p-6">
          <h3 className="font-headline-md text-[18px] text-on-surface font-bold mb-6">Panel de Tickets</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-label-md text-on-surface-variant/60 uppercase tracking-wider mb-2">Canal del Panel</label>
              <select className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors">
                <option value="">Selecciona un canal...</option>
                {/* Would populate with channels from API */}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-label-md text-on-surface-variant/60 uppercase tracking-wider mb-2">Título del Embed</label>
              <input type="text" className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors" defaultValue={config.panelEmbed?.title} />
            </div>
            <div>
              <label className="block text-[12px] font-label-md text-on-surface-variant/60 uppercase tracking-wider mb-2">Descripción</label>
              <textarea className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors h-24" defaultValue={config.panelEmbed?.description} />
            </div>
            <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary font-bold shadow-lg hover:brightness-110 hover:shadow-cyan-500/20 transition-all active:scale-95 mt-4">
              Enviar/Actualizar Panel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
