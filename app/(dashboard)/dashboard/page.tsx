"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
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
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
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
    teamLeads,
    departmentStats,
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
        <div className="flex gap-2 ml-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.teamSize} members
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.teamTotalHours} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {lead.teamUtilizationRate.toFixed(1)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
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
                ))}
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
                <p className="text-sm font-medium text-gray-600">Team Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departmentStats.totalTeamLeads}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
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
