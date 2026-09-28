import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { StudioOverview } from './components/StudioOverview';
import { PortfolioShowcase } from './components/PortfolioShowcase';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { VernikaCopilotView } from './components/VernikaCopilotView';
import { AuthConsole } from './components/AuthConsole';
import { DatabaseSyncMonitor } from './components/DatabaseSyncMonitor';
import { GoldenPrimeAppView } from './components/GoldenPrimeAppView';
import { VernikaAppView } from './components/VernikaAppView';
import { ChaknaStoreAppView } from './components/ChaknaStoreAppView';
import { VernikaWebsiteView } from './components/VernikaWebsiteView';
import { LoginScreen } from './components/LoginScreen';
import { hybridDB, UserAccount } from './services/hybridDatabase';
import { useTheme } from './services/themeContext';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [activeSession, setActiveSession] = useState<UserAccount | null>(hybridDB.getActiveSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = hybridDB.subscribe(() => {
      const sess = hybridDB.getActiveSession();
      setActiveSession(sess);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    hybridDB.setActiveSession(null);
    setActiveSession(null);
  };

  const handleTriggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 800);
  };

  if (!activeSession) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setActiveSession(user);
        }}
      />
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudioOverview onNavigate={(tab) => setActiveTab(tab)} />;
      case 'portfolio':
        return <PortfolioShowcase onNavigate={(tab) => setActiveTab(tab)} currentUser={activeSession} />;
      case 'workflow_builder':
        return <WorkflowBuilder />;
      case 'copilot':
        return <VernikaCopilotView />;
      case 'auth':
        return <AuthConsole currentUser={activeSession} onSelectUser={(u) => {
          hybridDB.setActiveSession(u);
          setActiveSession(u);
        }} />;
      case 'db_sync':
        return <DatabaseSyncMonitor />;
      case 'app_goldenprime':
        return <GoldenPrimeAppView />;
      case 'app_vernika':
        return <VernikaAppView />;
      case 'app_chaknastore':
        return <ChaknaStoreAppView />;
      case 'app_website':
        return <VernikaWebsiteView />;
      default:
        return <StudioOverview onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200 theme-${theme}`}>
      {/* Top Header Navigation */}
      <HeaderNav
        currentUser={activeSession}
        onOpenAuth={() => setActiveTab('auth')}
        onOpenDBSync={() => setActiveTab('db_sync')}
        syncing={syncing}
        onTriggerSync={handleTriggerSync}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Right Main Content View */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
