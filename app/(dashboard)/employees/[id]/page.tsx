"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Briefcase,
  Mail,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { employeeApi, worklogApi, authApi, dashboardApi } from "@/lib/api";
import {
  Employee,
  Worklog,
  User as AuthUser,
  DashboardResponse,
} from "@/lib/types";
import { toast } from "react-hot-toast";
import {
  canViewDepartmentData,
  canViewTeamData,
  getRoleDisplayName,
} from "@/lib/auth";
import Link from "next/link";
import { extractErrorMessage } from "@/lib/error-handler";

type PeriodFilter = "week" | "month" | "custom";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = Number(params.id);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );

  useEffect(() => {
    loadInitialData();
  }, [employeeId]);

  useEffect(() => {
    if (currentUser && employee) {
      loadWorklogs();
      loadDashboard();
    }
  }, [startDate, endDate, currentUser, employee]);

  const loadInitialData = async () => {
    try {
      // First, get the current user to check permissions
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);

      // Then load the employee details
      const employeeData = await employeeApi.getEmployee(employeeId);
      setEmployee(employeeData);

      // Check if the current user has permission to view this employee
      if (!canViewEmployeeData(user, employeeData)) {
        toast.error("You don't have permission to view this employee");
        router.push("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const canViewEmployeeData = (user: AuthUser, emp: Employee): boolean => {
    // Users can always view their own data
    if (user.id === emp.id) return true;

    // Directors can view anyone in their department
    if (canViewDepartmentData(user) && user.departmentId === emp.departmentId) {
      return true;
    }

    // Team leads can view their team members
    if (canViewTeamData(user) && emp.teamLeadId === user.id) {
      return true;
    }

    return false;
  };

  const loadWorklogs = async () => {
    if (!currentUser || !employee) return;

    try {
      let data: Worklog[];

      if (canViewDepartmentData(currentUser)) {
        // Director: use department endpoint
        data = await worklogApi.getDepartmentWorklogs(
          startDate,
          endDate,
          undefined,
          employeeId
        );
      } else if (canViewTeamData(currentUser)) {
        // Team Lead: use team endpoint
        data = await worklogApi.getTeamWorklogs(startDate, endDate, employeeId);
      } else {
        // Employee viewing their own data
        data = await worklogApi.getMyWorklogs(startDate, endDate);
      }

      setWorklogs(data);
    } catch (error) {
      console.error("Failed to load worklogs:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const loadDashboard = async () => {
    if (!currentUser || !employee) return;

    try {
      const dashboardData = await dashboardApi.getEmployeeDashboard(
        employeeId,
        startDate,
        endDate
      );
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Dashboard might not be available for all users, so we don't show an error
    }
  };

  const handlePeriodChange = (period: PeriodFilter) => {
    setPeriodFilter(period);
    const today = new Date();

    switch (period) {
      case "week":
        setStartDate(
          format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
        );
        setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
    }
  };

  // Calculate statistics
  const totalHours = worklogs.reduce((sum, w) => sum + w.hoursWorked, 0);
  const daysWorked = new Set(worklogs.map((w) => w.workDate)).size;
  const averageHours = daysWorked > 0 ? totalHours / daysWorked : 0;

  // Group worklogs by type for breakdown
  const worklogsByType = worklogs.reduce((acc, worklog) => {
    const typeName = worklog.worklogTypeName;
    if (!acc[typeName]) {
      acc[typeName] = { hours: 0, count: 0 };
    }
    acc[typeName].hours += worklog.hoursWorked;
    acc[typeName].count += 1;
    return acc;
  }, {} as Record<string, { hours: number; count: number }>);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.fullName}
            </h1>
            <p className="text-gray-600">
              {employee.role} • {employee.grade}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-900" />
            <div>
              <p className="text-sm text-gray-900">Email</p>
              <p className="font-medium text-gray-900">{employee.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-900">Department</p>
              <p className="font-medium text-gray-900">
                {employee.departmentName}
              </p>
            </div>
          </div>

          {employee.teamLeadName && (
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-900">Team Lead</p>
                <p className="font-medium text-gray-900">
                  {employee.teamLeadName}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Period Filter */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={periodFilter === "week" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handlePeriodChange("week")}
          >
            This Week
          </Button>
          <Button
            variant={periodFilter === "month" ? "primary" : "secondary"}
            size="sm"
            onClick={() => handlePeriodChange("month")}
          >
            This Month
          </Button>
        </div>

        <div className="flex gap-2 text-gray-900">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPeriodFilter("custom");
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
          <span className="self-center text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPeriodFilter("custom");
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-900">{totalHours}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Days Worked</p>
              <p className="text-2xl font-bold text-green-900">{daysWorked}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Avg Hours/Day
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {averageHours.toFixed(1)}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Worklog Type Breakdown */}
      {Object.keys(worklogsByType).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Work Type Breakdown</CardTitle>
          </CardHeader>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(worklogsByType).map(([type, data]) => {
                const percentage = (data.hours / totalHours) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {type}
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.hours} hours ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Worklogs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Logs</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {worklogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No worklogs found for the selected period
                  </td>
                </tr>
              ) : (
                worklogs.map((worklog) => (
                  <tr key={worklog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(worklog.workDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worklog.worklogTypeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worklog.hoursWorked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {worklog.projectName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {worklog.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
