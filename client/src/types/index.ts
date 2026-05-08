export type Role = 'admin' | 'crew';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  ship?: Ship | string | null;
}

export interface AuthUser extends User {
  token: string;
}

export interface Ship {
  _id: string;
  name: string;
  imoNumber: string;
  type: string;
  flag?: string;
  status: 'active' | 'docked' | 'maintenance';
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceNote {
  _id?: string;
  user: { _id: string; name: string } | string;
  text: string;
  createdAt: string;
}

export interface MaintenanceTask {
  _id: string;
  title: string;
  description?: string;
  ship: Ship | string;
  assignedTo?: User | string | null;
  createdBy?: User | string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt?: string | null;
  notes: MaintenanceNote[];
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DrillType =
  | 'fire'
  | 'evacuation'
  | 'man-overboard'
  | 'abandon-ship'
  | 'security'
  | 'medical'
  | 'other';

export type DrillStatus = 'scheduled' | 'completed' | 'missed';

export interface Drill {
  _id: string;
  title: string;
  type: DrillType;
  ship: Ship | string;
  scheduledDate: string;
  durationMinutes: number;
  status: DrillStatus;
  notes?: string;
  completedAt?: string | null;
  isMissed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrillAttendance {
  _id: string;
  drill: string | Drill;
  user: { _id: string; name: string } | string;
  attended: boolean;
  notes?: string;
  markedAt?: string;
}

export interface ShipComplianceReport {
  shipId: string;
  shipName: string;
  maintenance: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  drills: {
    total: number;
    completed: number;
    missed: number;
    upcoming: number;
    participationRate: number;
  };
  overallScore: number;
  status: 'compliant' | 'at-risk' | 'non-compliant';
}

export interface DashboardSummary {
  overallScore: number;
  totals: {
    maintenance: { total: number; completed: number; pending: number; overdue: number };
    drills: { total: number; completed: number; missed: number; upcoming: number };
  };
  ships: ShipComplianceReport[];
  recentOverdueTasks: MaintenanceTask[];
  upcomingDrills: Drill[];
}

export interface MyDashboard {
  tasks: { total: number; pending: number; inProgress: number; completed: number; overdue: number };
  drills: { total: number; upcoming: number; completed: number; attended: number };
  upcomingTasks: MaintenanceTask[];
  upcomingDrills: Drill[];
}

export interface AppNotification {
  _id: string;
  type: 'task-assigned' | 'task-overdue' | 'drill-scheduled' | 'drill-missed' | 'general';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
