"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { employeeApi, worklogApi, authApi } from "@/lib/api";
import { Employee, Worklog, User } from "@/lib/types";
import { toast } from "react-hot-toast";
import { canViewDepartmentData } from "@/lib/auth";
import Link from "next/link";
import { extractErrorMessage } from "@/lib/error-handler";
import {
  calculateWorkingDays,
  calculateExpectedHours,
  calculateUtilizationRate,
  getUtilizationColor,
  getProgressBarColor,
  getDateRangeForPeriod,
} from "@/lib/date-utils";

type PeriodFilter = "week" | "month" | "custom";

export default function TeamPage() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");

  // Initialize with current week dates
  const { startDate: initialStart, endDate: initialEnd } =
    getDateRangeForPeriod("week");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  // Calculate working days and expected hours for the current period
  const workingDaysInPeriod = calculateWorkingDays(startDate, endDate);
  const expectedHoursInPeriod = calculateExpectedHours(startDate, endDate);

  const isDepartmentView = user && canViewDepartmentData(user);
  const viewLabel = isDepartmentView ? "Department" : "Team";
  const memberLabel = isDepartmentView ? "Employees" : "Team Members";

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      loadWorklogs();
    }
  }, [startDate, endDate, selectedEmployee, user]);

  const loadInitialData = async () => {
    try {
      const [currentUser, visibleEmployees] = await Promise.all([
        authApi.getCurrentUser(),
        employeeApi.getVisibleEmployees(),
      ]);
      setUser(currentUser);
      setEmployees(visibleEmployees);
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorklogs = async () => {
    if (!user) return;

    try {
      let data: Worklog[];

      if (canViewDepartmentData(user)) {
        // Director can see department worklogs
        data = await worklogApi.getDepartmentWorklogs(
          startDate,
          endDate,
          undefined,
          selectedEmployee ? Number(selectedEmployee) : undefined
        );
      } else {
        // Team Lead can see team worklogs
        data = await worklogApi.getTeamWorklogs(
          startDate,
          endDate,
          selectedEmployee ? Number(selectedEmployee) : undefined
        );
      }

      setWorklogs(data);
    } catch (error) {
      console.error("Failed to load worklogs:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handlePeriodChange = (period: PeriodFilter) => {
    setPeriodFilter(period);

    if (period !== "custom") {
      const { startDate: newStart, endDate: newEnd } =
        getDateRangeForPeriod(period);
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };

  const teamStats = employees.map((employee) => {
    const employeeWorklogs = worklogs.filter(
      (w) => w.employeeId === employee.id
    );
    const totalHours = employeeWorklogs.reduce(
      (sum, w) => sum + w.hoursWorked,
      0
    );
    const daysWorked = new Set(employeeWorklogs.map((w) => w.workDate)).size;

    // Calculate utilization rate based on actual working days
    const utilizationRate = calculateUtilizationRate(
      totalHours,
      expectedHoursInPeriod
    );

    return {
      ...employee,
      totalHours,
      daysWorked,
      averageHours: daysWorked > 0 ? totalHours / daysWorked : 0,
      utilizationRate,
    };
  });

  const totalTeamHours = teamStats.reduce(
    (sum, stat) => sum + stat.totalHours,
    0
  );
  const averageTeamHours =
    teamStats.length > 0 ? totalTeamHours / teamStats.length : 0;

  // Calculate overall team utilization
  const teamUtilizationRate =
    teamStats.length > 0
      ? calculateUtilizationRate(
          totalTeamHours,
          expectedHoursInPeriod * teamStats.length
        )
      : 0;

  const employeeOptions = employees.map((emp) => ({
    value: emp.id.toString(),
    label: emp.fullName,
  }));

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {viewLabel} Overview
        </h1>
        <p className="text-gray-600">
          Manage and monitor {viewLabel.toLowerCase()} performance
        </p>
      </div>

      {/* Filters */}
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

        <div className="flex-1 max-w-xs">
          <Select
            options={[
              { value: "", label: `All ${memberLabel}` },
              ...employeeOptions,
            ]}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          />
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

      {/* Period Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Period Information</p>
            <p className="mt-1">
              Selected period contains{" "}
              <strong>{workingDaysInPeriod} working days</strong>, expecting{" "}
              <strong>{expectedHoursInPeriod} total hours</strong> per employee
              (8 hours/day).
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total {viewLabel} Hours
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {totalTeamHours}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                of {expectedHoursInPeriod * teamStats.length} expected
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                {viewLabel} Size
              </p>
              <p className="text-2xl font-bold text-green-900">
                {employees.length}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {memberLabel.toLowerCase()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Avg Hours/Member
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {averageTeamHours.toFixed(1)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                of {expectedHoursInPeriod} expected
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">
                {viewLabel} Utilization
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {teamUtilizationRate.toFixed(1)}%
              </p>
              <p className="text-xs text-orange-700 mt-1">overall rate</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>{viewLabel} Performance</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isDepartmentView ? "Employee" : "Team Member"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role / Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Hours/Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamStats.map((stat) => {
                return (
                  <tr key={stat.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/employees/${stat.id}?startDate=${startDate}&endDate=${endDate}&period=${periodFilter}`}
                        className="flex items-center hover:text-blue-600 transition-colors"
                      >
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                            {stat.firstName[0]}
                            {stat.lastName[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {stat.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stat.email}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stat.role}</div>
                      <div className="text-sm text-gray-500">{stat.grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.totalHours}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {expectedHoursInPeriod} expected
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.daysWorked}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {workingDaysInPeriod} working days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.averageHours.toFixed(1)} hours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${getUtilizationColor(
                            stat.utilizationRate
                          )}`}
                        >
                          {stat.utilizationRate.toFixed(1)}%
                        </span>
                        <div className="flex-1 w-5">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                                stat.utilizationRate
                              )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  stat.utilizationRate
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/employees/${stat.id}?startDate=${startDate}&endDate=${endDate}&period=${periodFilter}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {teamStats.length === 0 && (
                <tr>
                  <td
                    colSpan={isDepartmentView ? 8 : 7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No {memberLabel.toLowerCase()} found for the selected
                    period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
