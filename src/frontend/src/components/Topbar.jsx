import React from 'react';
import { Link } from 'react-router-dom';

export default function Topbar({ serverName, serverIcon, user }) {
  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-[#05060B] border-b border-outline-variant/10 shadow-sm flex justify-between items-center px-margin-desktop">
      <div className="flex items-center gap-6">
        <h1 className="text-[28px] font-headline-lg font-extrabold text-primary leading-tight tracking-tight">Tenancy</h1>
        
        <Link to="/dashboard" className="bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors rounded-full flex items-center px-5 py-2 border border-outline-variant/10">
          {serverIcon ? (
            <img src={serverIcon} alt="Server icon" className="w-5 h-5 rounded-full mr-2" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant/60 text-[18px] mr-2">dns</span>
          )}
          <span className="font-label-md text-on-surface text-[14px]">{serverName || 'Seleccionar Servidor'}</span>
          <span className="material-symbols-outlined text-on-surface-variant/60 ml-3 text-[20px]">expand_more</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex gap-6">
          <a className="font-label-md text-[14px] text-on-surface-variant/60 hover:text-primary transition-colors" href="#">Contacto</a>
          <a className="font-label-md text-[14px] text-on-surface-variant/60 hover:text-primary transition-colors" href="#">Docs</a>
          <a className="font-label-md text-[14px] text-on-surface-variant/60 hover:text-primary transition-colors" href="#">Ventajas</a>
          <a className="font-label-md text-[14px] text-on-surface-variant/60 hover:text-primary transition-colors flex flex-col leading-tight" href="#">
            <span>Invitar</span>
            <span>Bot</span>
          </a>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant/60 cursor-pointer hover:text-primary transition-colors text-[22px]">language</span>
          <div className="relative">
            <span className="material-symbols-outlined text-on-surface-variant/60 cursor-pointer hover:text-primary transition-colors text-[22px]">notifications</span>
            <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-[#05060B]"></div>
          </div>
          
          <div className="flex items-center gap-3 bg-surface-variant/20 px-2 py-1.5 rounded-full border border-outline-variant/10 cursor-pointer hover:bg-surface-variant/30 transition-all pl-4 ml-2">
            <span className="font-label-md text-[14px] text-on-surface">{user?.username || 'User'}</span>
            {user?.avatar ? (
              <img alt="User avatar" className="w-8 h-8 rounded-full border border-primary/30" src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-primary text-[18px]">person</span>
              </div>
            )}
            <a href="/auth/logout" className="bg-surface-container hover:bg-surface-variant/50 text-on-surface px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ml-1 border border-outline-variant/20">Salir</a>
          </div>
        </div>
      </div>
    </header>
  );
}
