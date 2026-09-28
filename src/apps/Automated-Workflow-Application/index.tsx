import React from 'react';
import { WorkflowBuilder } from '../../components/WorkflowBuilder';
import { VernikaCopilotView } from '../../components/VernikaCopilotView';
import { StudioOverview } from '../../components/StudioOverview';
import { PortfolioShowcase } from '../../components/PortfolioShowcase';
import { UserAccount } from '../../services/hybridDatabase';

interface AutomatedWorkflowAppProps {
  currentUser: UserAccount;
  activeSubView?: 'overview' | 'builder' | 'copilot' | 'portfolio';
  onNavigate: (tab: any) => void;
}

export const AutomatedWorkflowApp: React.FC<AutomatedWorkflowAppProps> = ({
  activeSubView = 'overview',
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {activeSubView === 'overview' && <StudioOverview onNavigate={onNavigate} />}
      {activeSubView === 'builder' && <WorkflowBuilder />}
      {activeSubView === 'copilot' && <VernikaCopilotView />}
      {activeSubView === 'portfolio' && <PortfolioShowcase onNavigate={onNavigate} />}
    </div>
  );
};

export { WorkflowBuilder, VernikaCopilotView, StudioOverview, PortfolioShowcase };
