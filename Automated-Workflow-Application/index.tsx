import React from 'react';
import { WorkflowBuilder } from '../src/components/WorkflowBuilder';
import { VernikaCopilotView } from '../src/components/VernikaCopilotView';
import { StudioOverview } from '../src/components/StudioOverview';
import { PortfolioShowcase } from '../src/components/PortfolioShowcase';
import { UserAccount } from '../src/services/hybridDatabase';

interface AutomatedWorkflowAppProps {
  currentUser?: UserAccount;
  activeSubView?: 'overview' | 'builder' | 'copilot' | 'portfolio';
  onNavigate: (tab: any) => void;
}

export const AutomatedWorkflowApp: React.FC<AutomatedWorkflowAppProps> = ({
  currentUser,
  activeSubView = 'overview',
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {activeSubView === 'overview' && <StudioOverview onNavigate={onNavigate} />}
      {activeSubView === 'builder' && <WorkflowBuilder />}
      {activeSubView === 'copilot' && <VernikaCopilotView />}
      {activeSubView === 'portfolio' && <PortfolioShowcase onNavigate={onNavigate} currentUser={currentUser} />}
    </div>
  );
};

export { WorkflowBuilder, VernikaCopilotView, StudioOverview, PortfolioShowcase };
export default AutomatedWorkflowApp;
