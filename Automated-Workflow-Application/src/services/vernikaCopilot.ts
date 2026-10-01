import { hybridDB, UserAccount } from './hybridDatabase';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actionPayload?: {
    type: 'create_record' | 'generate_workflow' | 'export_spreadsheet' | 'schema_sync';
    title: string;
    data: any;
  };
}

export class VernikaCopilotService {
  public async queryCopilot(userQuery: string): Promise<CopilotMessage> {
    const query = userQuery.toLowerCase().trim();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // GoldenPrime PG Query
    if (query.includes('pg') || query.includes('rent') || query.includes('tenant') || query.includes('goldenprime')) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'copilot',
        text: 'GoldenPrime PG Operations Audit: Total 12 Rooms occupied across 2 Buildings. Current monthly collection: ₹1,45,000. Overdue rent alerts sent to Room 102 (Rajesh Kumar, ₹12,000) and Room 204 (Priya Sharma, ₹8,500). Spreadsheet backup active in Google Drive.',
        timestamp: ts,
        actionPayload: {
          type: 'export_spreadsheet',
          title: 'Export Rent Audit Spreadsheet',
          data: [
            { Room: '101', Tenant: 'Amit Patel', Status: 'Paid', Rent: 14000 },
            { Room: '102', Tenant: 'Rajesh Kumar', Status: 'Overdue', Rent: 12000 },
            { Room: '204', Tenant: 'Priya Sharma', Status: 'Pending Sync', Rent: 8500 },
          ],
        },
      };
    }

    // Vernika HR & Workflow Query
    if (query.includes('employee') || query.includes('hr') || query.includes('attendance') || query.includes('vernika')) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'copilot',
        text: 'Vernika Business Suite Analytics: 24 Active Employees. Attendance rate today: 95.8%. 3 Pending Leave Requests (Rahul Verma - Casual Leave, 2 days). Active Projects: Automated Workflow Studio (In Progress - 78% complete).',
        timestamp: ts,
        actionPayload: {
          type: 'generate_workflow',
          title: 'HR Leave Approval Workflow',
          data: {
            workflowName: 'Auto Leave Approvals',
            steps: ['Employee Application', 'Department Head Review', 'Payroll Deduction Log', 'Google Sheet Sync'],
          },
        },
      };
    }

    // ChaknaStore Query
    if (query.includes('food') || query.includes('order') || query.includes('chakna') || query.includes('tiffin')) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'copilot',
        text: 'ChaknaStore Food Delivery Overview: 48 Orders placed today (₹28,400 Gross Revenue). Tiffin Subscriptions active: 32 Active Daily Plan Members. Top Dish: Special Paneer Thali & Roasted Peanuts.',
        timestamp: ts,
      };
    }

    // Create / Generate Database Record
    if (query.includes('create') || query.includes('add') || query.includes('generate')) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'copilot',
        text: 'I have generated a new standardized record schema across Supabase, Firebase, and Google Sheets backup folders for your application.',
        timestamp: ts,
        actionPayload: {
          type: 'create_record',
          title: 'New Hybrid DB Schema Created',
          data: {
            schema: 'automated_workflow_template',
            fields: ['id', 'workflow_name', 'created_by', 'sync_status', 'updated_at'],
          },
        },
      };
    }

    // Default Intelligence Response
    return {
      id: `msg_${Date.now()}`,
      sender: 'copilot',
      text: `Vernika Copilot AI at your service. I can assist you with real-time database synchronization, generating custom workflows from our 4 portfolio applications, calculating PG financials, or managing employee records across Supabase, Firebase, Google Drive, and Spreadsheets.`,
      timestamp: ts,
    };
  }
}

export const vernikaCopilot = new VernikaCopilotService();
