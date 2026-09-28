import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChatToastPopup } from './components/chat/ChatToastPopup';
import { InactivityWarningModal } from './components/common/InactivityWarningModal';
import { RealtimeNotificationToast } from './components/common/RealtimeNotificationToast';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { EmployeesScreen } from './screens/EmployeesScreen';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { LeavesScreen } from './screens/LeavesScreen';
import { DepartmentsScreen } from './screens/DepartmentsScreen';
import { PositionsScreen } from './screens/PositionsScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { TasksScreen } from './screens/TasksScreen';
import { CRMScreen } from './screens/CRMScreen';
import { InvoicingScreen } from './screens/InvoicingScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AnnouncementsScreen } from './screens/AnnouncementsScreen';
import { OrgTreeScreen } from './screens/OrgTreeScreen';
import { AiAssistantScreen } from './screens/AiAssistantScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { EmployeePortalScreen } from './screens/EmployeePortalScreen';
import { ClientPortalScreen } from './screens/ClientPortalScreen';
import { AuxStatusScreen } from './screens/AuxStatusScreen';
import { PayrollScreen } from './screens/PayrollScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { MeetingsScreen } from './screens/MeetingsScreen';
import { MailScreen } from './screens/MailScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { VernikaSheetsScreen } from './screens/VernikaSheetsScreen';
import { EmployeeTrackingScreen } from './screens/EmployeeTrackingScreen';
import { WorkflowManagementScreen } from './screens/WorkflowManagementScreen';
import { EmployeeDocumentsScreen } from './screens/EmployeeDocumentsScreen';
import { ClientsScreen } from './screens/ClientsScreen';

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown interface error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Vernika application error boundary:', error, info);
    this.setState({ hasError: true, message: error?.message || 'Unknown interface error' });
  }

  private reload = () => window.location.reload();

  private clearLocalCacheAndReload = () => {
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith('vernika_'))
        .forEach((key) => window.localStorage.removeItem(key));
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
          <h1 className="text-xl font-semibold">Vernika recovered from a screen error</h1>
          <p className="mt-3 text-sm text-slate-300">The application shell is still available. Reload first; if the problem persists, clear only Vernika’s local cache and reload.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={this.reload} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">Reload application</button>
            <button type="button" onClick={this.clearLocalCacheAndReload} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200">Clear local cache</button>
          </div>
        </div>
      </div>
    );
  }
}

const MainLayout: React.FC = () => {
  const { isAuthenticated, role, user, updateUser } = useAuth();
  const { activeScreen, setActiveScreen, employees } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Reset active screen to dashboard when switching roles or users to avoid unauthorized access
  React.useEffect(() => {
    if (isAuthenticated) {
      setActiveScreen('dashboard');
    }
  }, [user?.id, isAuthenticated, setActiveScreen]);

  React.useEffect(() => {
    if (isAuthenticated && role !== 'admin' && user?.allowedModules?.length && activeScreen !== 'dashboard' && !user.allowedModules.includes(activeScreen)) {
      setActiveScreen('dashboard');
    }
  }, [activeScreen, isAuthenticated, role, setActiveScreen, user?.allowedModules]);

  // Instant reactive employee profile & permissions synchronization
  React.useEffect(() => {
    if (user && role !== 'admin' && role !== 'client' && employees && employees.length > 0) {
      const matchedEmp = employees.find(
        (e) => e && (e.id === user.id || e.firebaseUid === user.id || e.employeeId === user.id || (e.email && user.email && e.email.trim().toLowerCase() === user.email.trim().toLowerCase()))
      );
      if (matchedEmp && Array.isArray(matchedEmp.allowedModules)) {
        const currentModules = Array.isArray(user.allowedModules) ? user.allowedModules : [];
        const currentModStr = currentModules.slice().sort().join(',');
        const newModStr = matchedEmp.allowedModules.slice().sort().join(',');
        if (currentModStr !== newModStr) {
          updateUser({
            allowedModules: matchedEmp.allowedModules,
            name: matchedEmp.name,
            avatar: matchedEmp.avatar,
            department: matchedEmp.department,
            title: matchedEmp.position,
            status: matchedEmp.status === 'On Leave' ? 'On Leave' : 'Active',
            loginEnabled: matchedEmp.loginEnabled,
            isDepartmentHead: matchedEmp.isDepartmentHead === true || matchedEmp.role === 'department_head',
            managedDepartment: matchedEmp.managedDepartment || matchedEmp.department,
            grantableModules: Array.isArray(matchedEmp.grantableModules) ? matchedEmp.grantableModules : [],
            canAssignProjects: matchedEmp.canAssignProjects === true
          });
        }
      }
    }
  }, [employees, user, role, updateUser]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Dedicated Client Portal Window (isolated client environment). Clients may
  // open the shared messenger from "Message Lead", but must never fall through
  // to the employee/admin screen switch or inherit their navigation surface.
  if (role === 'client') {
    return (
      <>
        {activeScreen === 'chat' ? <ChatScreen /> : <ClientPortalScreen />}
        <InactivityWarningModal />
      </>
    );
  }

  const renderScreen = () => {
    const scopedModules = Array.isArray(user?.allowedModules) ? user.allowedModules : [];
    const protectedScreen = activeScreen === 'dashboard' ? 'dashboard' : activeScreen;
    const canOpenScreen = role === 'admin' || scopedModules.includes(protectedScreen);
    if (!canOpenScreen) return <EmployeePortalScreen />;
    // All staff variants, including department heads and managers, use the Employee Command Portal on dashboard.
    const isStaffRole = role !== 'admin';
    if (isStaffRole && activeScreen === 'dashboard') {
      return <EmployeePortalScreen />;
    }

    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'sheets':
        return <VernikaSheetsScreen />;
      case 'tracking':
      case 'employee_tracking':
        return <EmployeeTrackingScreen />;
      case 'employees':
        return <EmployeesScreen />;
      case 'aux_status':
        return <AuxStatusScreen />;
      case 'workflow':
        return <WorkflowManagementScreen />;
      case 'documents':
        return <EmployeeDocumentsScreen />;
      case 'attendance':
        return <AttendanceScreen />;
      case 'leaves':
        return <LeavesScreen />;
      case 'departments':
        return <DepartmentsScreen />;
      case 'positions':
        return <PositionsScreen />;
      case 'projects':
        return <ProjectsScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'crm':
        return <CRMScreen />;
      case 'payroll':
        return <PayrollScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'invoicing':
        return <InvoicingScreen />;
      case 'clients':
        return <ClientsScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'mail':
        return <MailScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'meetings':
        return <MeetingsScreen />;
      case 'announcements':
        return <AnnouncementsScreen />;
      case 'orgtree':
        return <OrgTreeScreen />;
      case 'ai_assistant':
        return <AiAssistantScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return isStaffRole ? <EmployeePortalScreen /> : <DashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <InactivityWarningModal />
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <ChatToastPopup onOpenChat={() => setActiveScreen('chat')} />
        <RealtimeNotificationToast onOpen={(screen) => setActiveScreen((screen as any) || 'dashboard')} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{renderScreen()}</div>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
