"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { dashboardApi } from "@/lib/api";
import { DashboardStats as DashboardStatsType } from "@/lib/types";

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getQuickStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load quick stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Today's Hours</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.todayHours}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {stats.hasLoggedToday ? "Logged" : "Not logged yet"}
            </p>
          </div>
          <Clock className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Week Hours</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.weekHours}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {stats.remainingWeekHours} hours remaining
            </p>
          </div>
          <Calendar className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      {stats.teamSize !== undefined && stats.teamSize > 0 && (
        <>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Team Size</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.teamSize}
                </p>
                <p className="text-xs text-purple-600 mt-1">Active members</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Logged Today
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.teamMembersLoggedToday}/{stats.teamSize}
                </p>
                <p className="text-xs text-orange-600 mt-1">Team members</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
