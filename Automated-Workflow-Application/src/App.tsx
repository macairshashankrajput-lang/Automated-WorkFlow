import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { HeaderNav } from './components/HeaderNav';
import { StudioOverview } from './components/StudioOverview';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { VernikaCopilotView } from './components/VernikaCopilotView';
import { PortfolioShowcase } from './components/PortfolioShowcase';
import { DatabaseSyncMonitor } from './components/DatabaseSyncMonitor';
import { AuthConsole } from './components/AuthConsole';
import { LoginScreen } from './components/LoginScreen';
import { VernikaAppView } from './components/VernikaAppView';
import { GoldenPrimeAppView } from './components/GoldenPrimeAppView';
import { ChaknaStoreAppView } from './components/ChaknaStoreAppView';
import { VernikaWebsiteView } from './components/VernikaWebsiteView';
import { DEFAULT_ACCOUNTS, UserAccount } from './services/hybridDatabase';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => DEFAULT_ACCOUNTS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio_overview');

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Nav */}
        <HeaderNav
          currentUser={currentUser}
          onSwitchUser={(user) => setCurrentUser(user)}
          onLogout={() => setCurrentUser(null)}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {activeTab === 'studio_overview' && <StudioOverview onNavigate={setActiveTab} />}
          {activeTab === 'workflow_builder' && <WorkflowBuilder />}
          {activeTab === 'copilot' && <VernikaCopilotView />}
          {activeTab === 'portfolio' && <PortfolioShowcase onNavigate={setActiveTab} currentUser={currentUser} />}
          {activeTab === 'db_monitor' && <DatabaseSyncMonitor />}
          {activeTab === 'auth_console' && <AuthConsole currentUser={currentUser} />}
          {activeTab === 'app_vernika' && <VernikaAppView />}
          {activeTab === 'app_goldenprime' && <GoldenPrimeAppView />}
          {activeTab === 'app_chaknastore' && <ChaknaStoreAppView />}
          {activeTab === 'app_website' && <VernikaWebsiteView />}
        </main>
      </div>
    </div>
  );
}

export default App;
