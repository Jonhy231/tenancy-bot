import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Moderation() {
  const { serverData } = useOutletContext();
  const [loading, setLoading] = useState(false);

  // Fallback defaults if moderation is not yet set
  const initialMod = serverData?.config?.moderation || {
    autoDeleteLinks: false,
    autoDeleteSwearWords: false,
    logChannelId: ''
  };

  const [modConfig, setModConfig] = useState(initialMod);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Logic to save config to API
      // await fetch(`/api/server/${serverData.guild.id}/moderation`, { method: 'PATCH', body: JSON.stringify(modConfig) })
      setTimeout(() => setLoading(false), 1000); // Mock delay
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-stack-lg">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-headline-lg">admin_panel_settings</span>
          <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight uppercase">Moderación Automática</h2>
        </div>
        <p className="font-label-md text-on-surface-variant/60">Configura reglas básicas de protección para tu servidor.</p>
      </section>

      <section className="glass-card rounded-2xl p-8 max-w-3xl">
        <div className="space-y-6">
          {/* Anti Links */}
          <div className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/10">
            <div>
              <h3 className="font-headline-md text-[16px] text-on-surface font-bold">Bloqueo de Enlaces (Anti-Links)</h3>
              <p className="text-[12px] text-on-surface-variant/60">Elimina automáticamente mensajes que contengan enlaces "http://" o "https://".</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={modConfig.autoDeleteLinks} onChange={(e) => setModConfig({...modConfig, autoDeleteLinks: e.target.checked})} />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Anti Swear */}
          <div className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/10">
            <div>
              <h3 className="font-headline-md text-[16px] text-on-surface font-bold">Filtro de Palabras Ofensivas</h3>
              <p className="text-[12px] text-on-surface-variant/60">Elimina insultos comunes basados en una lista predefinida.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={modConfig.autoDeleteSwearWords} onChange={(e) => setModConfig({...modConfig, autoDeleteSwearWords: e.target.checked})} />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Log Channel */}
          <div>
            <label className="block text-[12px] font-label-md text-on-surface-variant/60 uppercase tracking-wider mb-2">Canal de Registro (Logs)</label>
            <select 
              className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              value={modConfig.logChannelId}
              onChange={(e) => setModConfig({...modConfig, logChannelId: e.target.value})}
            >
              <option value="">No registrar eventos</option>
              {/* Populate from API */}
            </select>
          </div>

          <div className="pt-4 border-t border-outline-variant/10">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
              Guardar Configuración
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
