"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { dashboardApi, authApi } from "@/lib/api";
import { DashboardStats as DashboardStatsType, User } from "@/lib/types";
import { canViewDepartmentData } from "@/lib/auth";
import { HOURS_PER_WEEK } from "@/lib/date-utils";

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load both user and stats in parallel for better performance
      const [userData, statsData] = await Promise.all([
        authApi.getCurrentUser(),
        dashboardApi.getQuickStats(),
      ]);
      setUser(userData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if this is department or team view
  const isDepartmentView = user && canViewDepartmentData(user);
  const viewLabel = isDepartmentView ? "Department" : "Team";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Calculate week progress percentage
  const weekProgress = Math.min(100, (stats.weekHours / HOURS_PER_WEEK) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Today's Hours Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-200 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Today's Hours</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.todayHours}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {stats.hasLoggedToday ? (
                <span className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Logged
                </span>
              ) : (
                <span className="text-blue-600">Not logged yet</span>
              )}
            </p>
          </div>
          <Clock className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      {/* Week Hours Card with Progress */}
      <Card className="bg-gradient-to-br from-green-50 to-green-200 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-600">Week Hours</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.weekHours}
              <span className="text-sm font-normal text-green-700 ml-2">
                / {HOURS_PER_WEEK}
              </span>
            </p>
            <div className="mt-2">
              <div className="w-full bg-green-300 rounded-full h-1.5">
                <div
                  className="bg-green-700 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${weekProgress}%` }}
                />
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stats.remainingWeekHours} hours remaining
              </p>
            </div>
          </div>
          <Calendar className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      {/* Conditional Team/Department Cards */}
      {stats.teamSize !== undefined && stats.teamSize > 0 ? (
        <>
          {/* Team/Department Size Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  {viewLabel} Size
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.teamSize}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {isDepartmentView ? "Total employees" : "Active members"}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          {/* Team/Department Activity Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-200 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  {viewLabel} Activity
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {/* Fixed: Added null check for teamMembersLoggedToday */}
                  {stats.teamMembersLoggedToday ?? 0}
                  <span className="text-lg font-normal text-orange-700">
                    /{stats.teamSize}
                  </span>
                </p>
                <div className="flex items-center mt-1">
                  <div className="flex-1 bg-orange-200 rounded-full h-1.5 mr-2">
                    <div
                      className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          stats.teamMembersLoggedToday && stats.teamSize > 0
                            ? (stats.teamMembersLoggedToday / stats.teamSize) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-orange-600">
                    {stats.teamMembersLoggedToday && stats.teamSize > 0
                      ? (
                          (stats.teamMembersLoggedToday / stats.teamSize) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Personal Productivity Card (for employees without teams) */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Week Progress
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {weekProgress.toFixed(0)}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Target: {HOURS_PER_WEEK} hours
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          {/* Month to Date Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-200 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Productivity
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.hasLoggedToday ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-orange-600 mt-1">Today's status</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
