"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DashboardStats } from "../components/DashboardStats";
import { dashboardApi } from "@/lib/api";
import { DashboardResponse } from "@/lib/types";
import { toast } from "react-hot-toast";
import { extractErrorMessage } from "@/lib/error-handler";
import { canViewDepartmentData } from "@/lib/auth";
import {
  calculateWorkingDays,
  calculateExpectedHours,
  calculateUtilizationRate,
  getUtilizationColor,
  getProgressBarColor,
  getDateRangeForPeriod,
  formatPeriodDescription,
} from "@/lib/date-utils";

type PeriodFilter = "week" | "month" | "custom";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");

  // Initialize with current week dates
  const { startDate: initialStart, endDate: initialEnd } =
    getDateRangeForPeriod("week");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  // Calculate working days and expected hours for the current period
  const workingDaysInPeriod = calculateWorkingDays(startDate, endDate);
  const expectedHoursInPeriod = calculateExpectedHours(startDate, endDate);

  useEffect(() => {
    loadDashboard();
  }, [startDate, endDate]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getDashboard(startDate, endDate);
      setDashboard(data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const {
    currentUser,
    periodSummary,
    worklogTypeBreakdown,
    teamMembers,
    teamStats,
    teamLeads,
    departmentStats,
    teamPerformanceInsights,
  } = dashboard;

  // Determine if this is department or team view
  const isDepartmentView = canViewDepartmentData(currentUser);
  const viewLabel = isDepartmentView ? "Department" : "Team";

  // Calculate personal utilization
  const personalUtilization = calculateUtilizationRate(
    periodSummary.totalHours,
    expectedHoursInPeriod
  );

  const periodDescription = formatPeriodDescription(
    periodSummary.startDate,
    periodSummary.endDate
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser.name}!
        </h1>
        <p className="text-gray-600">
          {currentUser.role} - {currentUser.department}
        </p>
      </div>

      {/* Quick Stats - role-aware! */}
      <DashboardStats />

      {/* Period Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
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
        <div className="flex gap-2 ml-auto text-gray-900">
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
            <p className="font-medium">Period Overview</p>
            <p className="mt-1">
              Showing data for{" "}
              <strong>{workingDaysInPeriod} working days</strong> (
              {periodDescription}
              ), expecting <strong>{expectedHoursInPeriod} hours</strong>…
            </p>
          </div>
        </div>
      </div>

      {/* Personal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-200 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-900">
                {periodSummary.totalHours}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                of {expectedHoursInPeriod} expected
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-200 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Days Worked</p>
              <p className="text-2xl font-bold text-green-900">
                {periodSummary.daysWorked}
              </p>
              <p className="text-xs text-green-700 mt-1">
                of {workingDaysInPeriod} working days
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Avg Hours/Day
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {periodSummary.averageHoursPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-purple-700 mt-1">Target: 8.0 hours</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-200 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Utilization</p>
              <p className="text-2xl font-bold text-orange-900">
                {personalUtilization.toFixed(1)}%
              </p>
              <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    personalUtilization >= 90
                      ? "bg-green-600"
                      : personalUtilization >= 70
                      ? "bg-blue-600"
                      : personalUtilization >= 50
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${Math.min(100, personalUtilization)}%` }}
                />
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-200 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Period</p>
              <p className="text-lg font-semibold text-indigo-900">
                {periodDescription}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Worklog Type Breakdown */}
      {worklogTypeBreakdown.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Work Distribution</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {worklogTypeBreakdown.map((type) => (
              <div key={type.typeName}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900 font-medium">
                    {type.typeName}
                  </span>
                  <span className="text-gray-600">
                    {type.hours} hours ({type.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${type.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Lead View - Team Members Table */}
      {teamMembers && teamMembers.length > 0 && (
        <>
          {/* Team Statistics Cards */}
          {teamStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-200 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {viewLabel} Size
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {teamStats.teamSize}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {isDepartmentView ? "Total employees" : "Team members"}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-200 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      {viewLabel} Total Hours
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {teamStats.totalTeamHours}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      of {expectedHoursInPeriod * teamStats.teamSize} expected
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Avg Hours/Member
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {teamStats.averageHoursPerMember.toFixed(1)}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      of {expectedHoursInPeriod} expected
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-200 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      {viewLabel} Utilization
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {teamStats.teamUtilizationRate.toFixed(1)}%
                    </p>
                    <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          teamStats.teamUtilizationRate >= 90
                            ? "bg-green-600"
                            : teamStats.teamUtilizationRate >= 70
                            ? "bg-blue-600"
                            : teamStats.teamUtilizationRate >= 50
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            teamStats.teamUtilizationRate
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Team Members Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {isDepartmentView ? "Department Members" : "My Team Members"}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isDepartmentView ? "Employee" : "Team Member"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => {
                    const hasLoggedWork = member.totalHours > 0;

                    return (
                      <tr key={member.id} className="hover:bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.totalHours}
                          <span className="text-xs text-gray-500 ml-1">
                            / {expectedHoursInPeriod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.daysWorked}
                          <span className="text-xs text-gray-500 ml-1">
                            / {workingDaysInPeriod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${getUtilizationColor(
                                member.utilizationRate
                              )}`}
                            >
                              {member.utilizationRate.toFixed(1)}%
                            </span>
                            <div className="flex-1 w-20">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                                    member.utilizationRate
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      member.utilizationRate
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasLoggedWork ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center w-17 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              No logs
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Director View - Team Performance Insights */}
      {teamPerformanceInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Best Performing Team */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Best Performing Team
                </p>
                <p className="text-xl font-bold text-green-900 mt-1">
                  {teamPerformanceInsights.bestPerformingTeamName}
                </p>
                <p className="text-2xl font-bold text-green-700 mt-2">
                  {teamPerformanceInsights.bestPerformingTeamUtilization.toFixed(
                    1
                  )}
                  %
                </p>
                <p className="text-sm text-green-600 mt-1">Utilization Rate</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          {/* Worst Performing Team */}
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">
                  Needs Attention
                </p>
                <p className="text-xl font-bold text-red-900 mt-1">
                  {teamPerformanceInsights.worstPerformingTeamName}
                </p>
                <p className="text-2xl font-bold text-red-700 mt-2">
                  {teamPerformanceInsights.worstPerformingTeamUtilization.toFixed(
                    1
                  )}
                  %
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Gap: {teamPerformanceInsights.utilizationGap.toFixed(1)}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Director View - Team Leads Summary */}
      {teamLeads && teamLeads.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Team Leaders Overview</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamLeads.map((lead) => {
                  const complianceRate =
                    lead.teamSize > 0
                      ? (
                          (lead.teamMembersWithLogs / lead.teamSize) *
                          100
                        ).toFixed(0)
                      : "0";
                  const complianceColor =
                    Number(complianceRate) >= 80
                      ? "text-green-600"
                      : Number(complianceRate) >= 60
                      ? "text-yellow-600"
                      : "text-red-600";

                  return (
                    <tr key={lead.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.teamSize} members
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={complianceColor}>
                          {lead.teamMembersWithLogs}/{lead.teamSize}
                        </span>
                        <span className="text-gray-900 ml-1">
                          ({complianceRate}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.teamTotalHours}
                        <span className="text-xs text-gray-500 ml-1">
                          / {expectedHoursInPeriod * lead.teamSize}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${getUtilizationColor(
                          lead.teamUtilizationRate
                        )}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {lead.teamUtilizationRate.toFixed(1)}%
                          </span>
                          <div className="flex-1 w-20">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                                  lead.teamUtilizationRate
                                )}`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    lead.teamUtilizationRate
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Department Stats */}
      {departmentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-200 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Department Size
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {departmentStats.totalEmployees}
                </p>
                <p className="text-xs text-blue-700 mt-1">Total employees</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              departmentStats.logComplianceRate >= 80
                ? "from-green-50 to-green-200 border-green-200"
                : "from-red-50 to-red-200 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    departmentStats.logComplianceRate >= 80
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Log Compliance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    departmentStats.logComplianceRate >= 80
                      ? "text-green-900"
                      : "text-red-900"
                  }`}
                >
                  {departmentStats.logComplianceRate?.toFixed(1) || 0}%
                </p>
                <p
                  className={`text-xs mt-1 ${
                    departmentStats.logComplianceRate >= 80
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {departmentStats.employeesWithLogs}/
                  {departmentStats.totalEmployees} logged
                </p>
              </div>
              {departmentStats.logComplianceRate < 80 ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Users className="h-8 w-8 text-green-500" />
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Dept. Total Hours
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {departmentStats.departmentTotalHours}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  of {expectedHoursInPeriod * departmentStats.totalEmployees}{" "}
                  expected
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-200 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Dept. Utilization
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {departmentStats.departmentUtilizationRate.toFixed(1)}%
                </p>
                <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      departmentStats.departmentUtilizationRate >= 90
                        ? "bg-green-600"
                        : departmentStats.departmentUtilizationRate >= 70
                        ? "bg-blue-600"
                        : departmentStats.departmentUtilizationRate >= 50
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        departmentStats.departmentUtilizationRate
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
