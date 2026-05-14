import React from 'react';

export default function Topbar({ serverName, serverIcon, user }) {
  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-surface/80 dark:bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm flex justify-between items-center px-margin-desktop">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <div className="flex items-center gap-3">
          {serverIcon ? (
            <img src={serverIcon} alt="Server icon" className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-variant/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/60">dns</span>
            </div>
          )}
          <div>
            <h2 className="font-headline-md text-[18px] text-on-surface font-bold leading-none">{serverName || 'Loading...'}</h2>
            <span className="font-label-md text-[12px] text-on-surface-variant/60">Dashboard</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex gap-6">
          <a className="font-label-md text-label-md text-on-surface-variant/60 hover:text-primary transition-colors" href="#">Contacto</a>
          <a className="font-label-md text-label-md text-on-surface-variant/60 hover:text-primary transition-colors" href="#">Docs</a>
        </div>
        
        <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-surface-variant/20 px-3 py-1.5 rounded-full border border-outline-variant/10 cursor-pointer hover:bg-surface-variant/30 transition-all">
            {user?.avatar && (
              <img alt="User avatar" className="w-8 h-8 rounded-full" src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} />
            )}
            <span className="font-label-md text-on-surface">{user?.username || 'User'}</span>
            <a href="/auth/logout" className="bg-error/10 hover:bg-error/20 text-error px-3 py-1 rounded-lg text-[12px] font-bold transition-all ml-2">Salir</a>
          </div>
        </div>
      </div>
    </header>
  );
}
