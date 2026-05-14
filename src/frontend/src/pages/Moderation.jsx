import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Moderation() {
  const { serverData } = useOutletContext();
  
  const historyLog = [
    { mod: 'Admin_X', modInitial: 'A', modColor: 'bg-primary/20 text-primary', user: 'User#1234', action: 'BAN', actionColor: 'bg-error/10 text-error border-error/20', reason: 'Severe Spam / Raiding', date: '11 May 2026, 14:20' },
    { mod: 'Mod_Kira', modInitial: 'M', modColor: 'bg-[#d9b9ff]/20 text-[#d9b9ff]', user: 'Gamer_Boy', action: 'MUTE', actionColor: 'bg-[#d9b9ff]/10 text-[#d9b9ff] border-[#d9b9ff]/20', reason: 'Excessive Caps in #general', date: '11 May 2026, 12:05' },
    { mod: 'Admin_X', modInitial: 'A', modColor: 'bg-primary/20 text-primary', user: 'Shadow_99', action: 'WARN', actionColor: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20', reason: 'Off-topic in #support', date: '11 May 2026, 10:45' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pt-4">
      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-variant/30 flex items-center justify-center border border-outline-variant/20 shadow-lg">
            <span className="material-symbols-outlined text-white text-[24px]">gavel</span>
          </div>
          <div>
            <h2 className="text-[32px] font-headline-lg font-extrabold text-white tracking-tight uppercase leading-tight">Gestión de Moderación</h2>
            <p className="font-label-md text-[13px] text-on-surface-variant/60">Say · Discord Bot Dev</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-surface-variant/30 border border-outline-variant/20 rounded-full flex items-center px-4 py-2 gap-2">
            <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
            <span className="font-label-md text-[12px] font-bold text-on-surface-variant/60">SYS_</span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="glass-card h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:bg-white/5 transition-all">
          <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          <span className="material-symbols-outlined text-primary text-[28px] group-hover:scale-110 transition-transform">person_remove</span>
          <span className="font-bold text-[18px] text-white">Kick</span>
        </button>
        <button className="glass-card h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:bg-white/5 transition-all">
          <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffb4ab] to-transparent opacity-50"></div>
          <span className="material-symbols-outlined text-[#ffb4ab] text-[28px] group-hover:scale-110 transition-transform">gavel</span>
          <span className="font-bold text-[18px] text-white">Ban</span>
        </button>
        <button className="glass-card h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:bg-white/5 transition-all">
          <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d9b9ff] to-transparent opacity-50"></div>
          <span className="material-symbols-outlined text-[#d9b9ff] text-[28px] group-hover:scale-110 transition-transform">volume_off</span>
          <span className="font-bold text-[18px] text-white">Mute</span>
        </button>
        <button className="glass-card h-[120px] rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:bg-white/5 transition-all">
          <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd1d9] to-transparent opacity-50"></div>
          <span className="material-symbols-outlined text-[#ffd1d9] text-[28px] group-hover:scale-110 transition-transform">warning</span>
          <span className="font-bold text-[18px] text-white">Warn</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-3 glass-card p-8 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant/60">show_chart</span>
              <h3 className="font-headline-md text-[18px] font-bold text-white">Moderation Trends</h3>
            </div>
            <button className="bg-surface-variant/30 hover:bg-surface-variant/50 px-4 py-2 rounded-lg border border-outline-variant/10 text-on-surface-variant/60 text-[13px] font-bold flex items-center gap-2 transition-colors">
              Last 7 Days
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-[200px] mt-auto">
            {/* Chart Bars */}
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[80px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">MON</span>
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[140px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">TUE</span>
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[90px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">WED</span>
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[160px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">THU</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1 relative group">
              <div className="absolute -top-8 text-white font-bold text-[14px]">22</div>
              <div className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-sm h-[120px] shadow-[0_-10px_20px_rgba(0,210,255,0.2)]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40 mt-2">FRI</span>
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[100px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">SAT</span>
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="w-full bg-surface-variant/30 rounded-t-sm h-[70px]"></div>
              <span className="text-[11px] font-label-md text-on-surface-variant/40">SUN</span>
            </div>
          </div>
        </div>

        {/* Side Stats */}
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 rounded-2xl flex-1 flex flex-col justify-center border-[#ffb4ab]/10 bg-[#ffb4ab]/[0.02]">
            <span className="font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant/60 font-bold mb-2">Active Bans</span>
            <span className="font-display-lg text-[42px] font-extrabold text-[#ffb4ab] leading-none">1,204</span>
          </div>
          <div className="glass-card p-6 rounded-2xl flex-1 flex flex-col justify-center border-primary/10 bg-primary/[0.02]">
            <span className="font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant/60 font-bold mb-2">Warnings Issued</span>
            <span className="font-display-lg text-[42px] font-extrabold text-primary leading-none">842</span>
          </div>
          <div className="glass-card p-6 rounded-2xl flex-1 flex flex-col justify-center border-[#d9b9ff]/10 bg-[#d9b9ff]/[0.02]">
            <span className="font-label-md text-[12px] uppercase tracking-widest text-on-surface-variant/60 font-bold mb-2">Active Mutes</span>
            <span className="font-display-lg text-[42px] font-extrabold text-[#d9b9ff] leading-none">15</span>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <section className="glass-card rounded-2xl overflow-hidden shadow-2xl pb-4">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant/60">history</span>
            <h2 className="font-headline-md text-[18px] font-bold text-white">Moderation History Log</h2>
          </div>
          <a href="#" className="font-label-md text-[13px] font-bold text-primary hover:underline">View All</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0A0D14]">
              <tr>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Moderator</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">User</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Action</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Reason</th>
                <th className="px-8 py-4 font-label-md text-[12px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {historyLog.map((log, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${log.modColor} flex items-center justify-center font-bold text-[14px]`}>
                        {log.modInitial}
                      </div>
                      <span className="font-bold text-white text-[14px]">{log.mod}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-on-surface-variant/80 text-[14px]">{log.user}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-block px-4 py-1 rounded-full font-label-md text-[10px] uppercase font-bold border ${log.actionColor}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-body-md text-on-surface-variant/60 text-[14px]">{log.reason}</td>
                  <td className="px-8 py-5 font-label-md text-on-surface-variant/50 text-[12px]">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
