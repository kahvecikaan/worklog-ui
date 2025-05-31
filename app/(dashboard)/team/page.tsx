"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Users, Clock, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { employeeApi, worklogApi, authApi } from "@/lib/api";
import { Employee, Worklog, User } from "@/lib/types";
import { toast } from "react-hot-toast";
import { canViewDepartmentData } from "@/lib/auth";
import Link from "next/link";

type PeriodFilter = "week" | "month" | "custom";

export default function TeamPage() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
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
      toast.error("Failed to load team data");
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
      toast.error("Failed to load worklogs");
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

  // Calculate team statistics
  const teamStats = employees.map((employee) => {
    const employeeWorklogs = worklogs.filter(
      (w) => w.employeeId === employee.id
    );
    const totalHours = employeeWorklogs.reduce(
      (sum, w) => sum + w.hoursWorked,
      0
    );
    const daysWorked = new Set(employeeWorklogs.map((w) => w.workDate)).size;

    return {
      ...employee,
      totalHours,
      daysWorked,
      averageHours: daysWorked > 0 ? totalHours / daysWorked : 0,
    };
  });

  const totalTeamHours = teamStats.reduce(
    (sum, stat) => sum + stat.totalHours,
    0
  );
  const averageTeamHours =
    teamStats.length > 0 ? totalTeamHours / teamStats.length : 0;

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
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
          {canViewDepartmentData(user) ? "Department" : "Team"} Overview
        </h1>
        <p className="text-gray-600">
          Manage and monitor{" "}
          {canViewDepartmentData(user) ? "department" : "team"} performance
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
              { value: "", label: "All Team Members" },
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Team Hours
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {totalTeamHours}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Team Size</p>
              <p className="text-2xl font-bold text-green-900">
                {employees.length}
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
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members Performance</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
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
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamStats.map((stat) => {
                const expectedHours = 40; // Weekly expected hours
                const progress = (stat.totalHours / expectedHours) * 100;

                return (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/employees/${stat.id}`}
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
                      <div className="text-sm text-gray-500">
                        {stat.grade.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.totalHours} hours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.daysWorked} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stat.averageHours.toFixed(1)} hours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress >= 100
                                  ? "bg-green-600"
                                  : progress >= 75
                                  ? "bg-blue-600"
                                  : progress >= 50
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/employees/${stat.id}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
