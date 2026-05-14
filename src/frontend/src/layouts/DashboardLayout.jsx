import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  const { guildId } = useParams();
  const [serverData, setServerData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch server data and user info
    const fetchData = async () => {
      try {
        const [meRes, serverRes] = await Promise.all([
          fetch('/api/me'),
          fetch(`/api/server/${guildId}`)
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData);
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/';
          return;
        }

        if (serverRes.ok) {
          const data = await serverRes.json();
          setServerData(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guildId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="font-body-md text-body-md min-h-screen flex bg-background text-on-surface">
      <Sidebar guildId={guildId} />
      
      <main className="flex-1 md:ml-[260px] relative flex flex-col min-h-screen">
        <Topbar 
          serverName={serverData?.guild?.name} 
          serverIcon={serverData?.guild?.icon} 
          user={user} 
        />
        
        <div className="p-margin-desktop space-y-stack-lg max-w-container-max mx-auto w-full flex-1">
          {/* We pass the fetched server context to the child routes via Outlet context */}
          <Outlet context={{ serverData, guildId, setServerData }} />
        </div>
      </main>
    </div>
  );
}
