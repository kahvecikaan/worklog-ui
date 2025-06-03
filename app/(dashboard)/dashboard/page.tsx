"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Calendar, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DashboardStats } from "../components/DashboardStats";
import { dashboardApi } from "@/lib/api";
import { DashboardResponse } from "@/lib/types";
import { toast } from "react-hot-toast";

type PeriodFilter = "week" | "month" | "custom";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfWeek(new Date()), "yyyy-MM-dd")
  );

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
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
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

      {/* Quick Stats */}
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

      {/* Personal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {periodSummary.totalHours}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Worked</p>
              <p className="text-2xl font-bold text-gray-900">
                {periodSummary.daysWorked}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-gray-900">
                {periodSummary.averageHoursPerDay.toFixed(1)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {periodSummary.period}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
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
                  <span className="text-gray-900">{type.typeName}</span>
                  <span className="text-gray-600">
                    {type.hours} hours ({type.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
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
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Team Size
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.teamSize}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Team Total Hours
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.totalTeamHours}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg Hours/Member
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.averageHoursPerMember.toFixed(1)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Team Utilization
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamStats.teamUtilizationRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Team Members Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>My Team Members</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Team Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Days Worked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Utilization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamMembers.map((member) => {
                    const hasLoggedWork = member.totalHours > 0;
                    const utilizationColor =
                      member.utilizationRate >= 80
                        ? "text-green-600"
                        : member.utilizationRate >= 60
                        ? "text-blue-600"
                        : member.utilizationRate >= 40
                        ? "text-yellow-600"
                        : "text-red-600";

                    return (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.totalHours} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.daysWorked} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <span className={utilizationColor}>
                              {member.utilizationRate.toFixed(1)}%
                            </span>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  member.utilizationRate >= 80
                                    ? "bg-green-600"
                                    : member.utilizationRate >= 60
                                    ? "bg-blue-600"
                                    : member.utilizationRate >= 40
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    member.utilizationRate
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasLoggedWork ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
          <Card className="border-green-200 bg-green-50">
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
          <Card className="border-red-200 bg-red-50">
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
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                    Team Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                    Team Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                    Active Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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
                    <tr key={lead.id}>
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
                        {lead.teamTotalHours} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {lead.teamUtilizationRate.toFixed(1)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                lead.teamUtilizationRate >= 80
                                  ? "bg-green-600"
                                  : lead.teamUtilizationRate >= 60
                                  ? "bg-blue-600"
                                  : lead.teamUtilizationRate >= 40
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  lead.teamUtilizationRate
                                )}%`,
                              }}
                            />
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
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentStats.totalEmployees}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Log Compliance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentStats.logComplianceRate?.toFixed(1) || 0}%
                  <span className="text-xs text-gray-600 font-normal ml-2">
                    ({departmentStats.employeesWithLogs}/
                    {departmentStats.totalEmployees} logged)
                  </span>
                </p>
              </div>
              {departmentStats.logComplianceRate < 80 && (
                <AlertCircle className="h-8 w-8 text-red-500 relative" />
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dept. Total Hours
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentStats.departmentTotalHours}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dept. Utilization
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentStats.departmentUtilizationRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
