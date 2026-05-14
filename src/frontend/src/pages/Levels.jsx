import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Levels() {
  const { serverData } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'settings'

  const initialLevels = serverData?.config?.levels || {
    enabled: false,
    xpPerMessage: 10,
    levelUpChannelId: ''
  };

  const [levelConfig, setLevelConfig] = useState(initialLevels);

  return (
    <div className="space-y-stack-lg">
      <section className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-headline-lg">military_tech</span>
            <h2 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight uppercase">Sistema de Niveles</h2>
          </div>
          <p className="font-label-md text-on-surface-variant/60">Fomenta la actividad premiando a tus usuarios con XP.</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-outline-variant/10">
        <button 
          className={`pb-4 px-2 font-headline-md text-[16px] transition-colors relative ${activeTab === 'leaderboard' ? 'text-primary font-bold' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
          {activeTab === 'leaderboard' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"></div>}
        </button>
        <button 
          className={`pb-4 px-2 font-headline-md text-[16px] transition-colors relative ${activeTab === 'settings' ? 'text-primary font-bold' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
          onClick={() => setActiveTab('settings')}
        >
          Configuración
          {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"></div>}
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <section className="glass-card rounded-2xl overflow-hidden">
           <table className="w-full text-left">
            <thead className="bg-surface-container-high/30">
              <tr>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Rank</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Usuario</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">Nivel</th>
                <th className="px-6 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-tighter">XP Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">leaderboard</span>
                  <p>Aún no hay datos en el ranking.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : (
        <section className="glass-card rounded-2xl p-8 max-w-3xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/10">
              <div>
                <h3 className="font-headline-md text-[16px] text-on-surface font-bold">Activar Niveles</h3>
                <p className="text-[12px] text-on-surface-variant/60">Habilitar la obtención de experiencia (XP) por cada mensaje.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={levelConfig.enabled} onChange={(e) => setLevelConfig({...levelConfig, enabled: e.target.checked})} />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-[12px] font-label-md text-on-surface-variant/60 uppercase tracking-wider mb-2">XP por Mensaje</label>
              <input type="number" min="1" max="50" className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors" value={levelConfig.xpPerMessage} onChange={(e) => setLevelConfig({...levelConfig, xpPerMessage: Number(e.target.value)})} />
            </div>

            <div className="pt-4 border-t border-outline-variant/10">
              <button 
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                Guardar
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
