export type Role = 'EMPLOYEE' | 'TEAM_LEAD' | 'DIRECTOR';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  departmentId: number;
  departmentName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WorklogType {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface Worklog {
  id: number;
  employeeId: number;
  employeeName: string;
  worklogTypeId: number;
  worklogTypeName: string;
  workDate: string;
  hoursWorked: number;
  daysWorked: number;
  description: string;
  projectName: string;
  isEditable: boolean;
}

export interface WorklogCreateRequest {
  worklogTypeId: number;
  workDate: string;
  hoursWorked: number;
  description: string;
  projectName: string;
}

export interface DashboardStats {
  todayHours: number;
  weekHours: number;
  remainingWeekHours: number;
  hasLoggedToday: boolean;
  teamSize?: number;
  teamMembersLoggedToday?: number;
}

export interface DashboardResponse {
  currentUser: {
    id: number;
    name: string;
    role: string;
    department: string;
  };
  periodSummary: {
    totalHours: number;
    totalDays: number;
    daysWorked: number;
    averageHoursPerDay: number;
    period: string;
  };
  worklogTypeBreakdown: Array<{
    typeName: string;
    hours: number;
    percentage: number;
  }>;
  recentWorklogs: Array<{
    date: string;
    type: string;
    hours: number;
    description: string;
    projectName: string;
  }>;
  teamMembers?: Array<{
    id: number;
    name: string;
    grade: string;
    totalHours: number;
    daysWorked: number;
    utilizationRate: number;
  }>;
  teamStats?: {
    teamSize: number;
    totalTeamHours: number;
    averageHoursPerMember: number;
    teamUtilizationRate: number;
  };
  teamLeads?: Array<{
    id: number;
    name: string;
    teamSize: number;
    teamTotalHours: number;
    teamUtilizationRate: number;
  }>;
  departmentStats?: {
    totalEmployees: number;
    totalTeamLeads: number;
    departmentTotalHours: number;
    departmentUtilizationRate: number;
  };
}

export interface Employee {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    grade: string;
    role: string;
    teamLeadId: number | null;
    teamLeadName: string | null;
    departmentId: number;
    departmentName: string;
    isActive: boolean;
  }