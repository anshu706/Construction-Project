/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ProjectManager' | 'SiteSupervisor' | 'FinanceManager' | 'Executive' | 'SafetyOfficer';

export interface UserProfile {
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  department: string;
  focus: string;
}

export interface Task {
  id: string;
  name: string;
  phase: 'Excavation' | 'Foundation' | 'Framing' | 'HVAC/Electrical' | 'Finishing' | 'Exterior';
  startDate: string;
  endDate: string;
  progress: number; // 0 to 100
  assignedCrew: string;
  dependencies: string[]; // Task IDs
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Delayed';
  notes?: string;
}

export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  category: 'Labor' | 'Materials' | 'Equipment' | 'Subcontractors';
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  date: string;
  description: string;
}

export interface SafetyIncident {
  id: string;
  date: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  type: 'First Aid' | 'Near-Miss' | 'Lost-Time' | 'Equipment Damage';
  description: string;
  status: 'Open' | 'Under Investigation' | 'Resolved';
  actionTaken?: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  type: 'safety' | 'task_update' | 'financial' | 'equipment' | 'weather' | 'general';
  severity: 'info' | 'warning' | 'alert' | 'success';
  message: string;
  user: string;
}

export interface ProjectRisk {
  id: string;
  title: string;
  category: 'Schedule' | 'Financial' | 'Safety' | 'External' | 'Resource';
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  status: 'Monitored' | 'Mitigating' | 'Resolved';
  mitigationPlan: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  completedDate?: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Complete';
}

export interface PunchItem {
  id: string;
  item: string;
  location: string;
  phase: string;
  severity: 'Critical' | 'Major' | 'Minor';
  subcontractor: string;
  status: 'Open' | 'In Progress' | 'Ready for Inspection' | 'Closed';
  dateReported: string;
  photoUrl?: string;
  resolutionNotes?: string;
}

export interface ProjectState {
  tasks: Task[];
  invoices: Invoice[];
  incidents: SafetyIncident[];
  logs: OperationLog[];
  risks: ProjectRisk[];
  milestones: Milestone[];
  punchItems?: PunchItem[];
  weather: {
    temp: number;
    condition: string;
    wind: number;
    humidity: number;
    forecast: string;
  };
  simulationSpeed: 'paused' | 'normal' | 'fast';
}

