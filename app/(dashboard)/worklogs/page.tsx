"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Plus, Calendar, Trash2, Edit } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { worklogApi } from "@/lib/api";
import { Worklog } from "@/lib/types";
import { toast } from "react-hot-toast";
import { extractErrorMessage } from "@/lib/error-handler";

export default function WorklogsPage() {
  const router = useRouter();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );

  useEffect(() => {
    loadWorklogs();
  }, [startDate, endDate]);

  const loadWorklogs = async () => {
    setIsLoading(true);
    try {
      const data = await worklogApi.getMyWorklogs(startDate, endDate);
      setWorklogs(data);
    } catch (error) {
      console.error("Failed to load worklogs:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this worklog?")) return;

    try {
      await worklogApi.deleteWorklog(id);
      toast.success("Worklog deleted successfully");
      loadWorklogs();
    } catch (error) {
      console.error("Failed to delete worklog:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const groupedWorklogs = worklogs.reduce((acc, worklog) => {
    const date = worklog.workDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(worklog);
    return acc;
  }, {} as Record<string, Worklog[]>);

  const totalHours = worklogs.reduce((sum, w) => sum + w.hoursWorked, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Worklogs</h1>
          <p className="text-gray-600">Track your daily work activities</p>
        </div>
        <Button onClick={() => router.push("/worklogs/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Worklog
        </Button>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const today = new Date();
                setStartDate(
                  format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
                );
                setEndDate(
                  format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
                );
              }}
            >
              This Week
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const today = new Date();
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(today.getDate() - 7);
                setStartDate(
                  format(
                    startOfWeek(lastWeekStart, { weekStartsOn: 1 }),
                    "yyyy-MM-dd"
                  )
                );
                setEndDate(
                  format(
                    endOfWeek(lastWeekStart, { weekStartsOn: 1 }),
                    "yyyy-MM-dd"
                  )
                );
              }}
            >
              Last Week
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Period Total</p>
            <p className="text-2xl font-bold text-blue-900">
              {totalHours} hours
            </p>
          </div>
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      {/* Worklogs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedWorklogs).length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No worklogs found for this period
          </p>
          <Button onClick={() => router.push("/worklogs/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Worklog
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedWorklogs)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, logs]) => {
              const dayTotal = logs.reduce(
                (sum, log) => sum + log.hoursWorked,
                0
              );
              return (
                <div key={date}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {format(new Date(date), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <span className="text-sm font-medium text-gray-600">
                      {dayTotal} hours
                    </span>
                  </div>
                  <div className="space-y-3">
                    {logs.map((worklog) => (
                      <Card
                        key={worklog.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {worklog.worklogTypeName}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {worklog.hoursWorked} hours
                              </span>
                              {worklog.projectName && (
                                <span className="text-sm text-gray-600">
                                  • {worklog.projectName}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">
                              {worklog.description}
                            </p>
                          </div>
                          {worklog.isEditable && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  router.push(`/worklogs/${worklog.id}/edit`)
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(worklog.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
