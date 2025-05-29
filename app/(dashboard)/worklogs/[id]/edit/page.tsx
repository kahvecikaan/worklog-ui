"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { worklogApi } from "@/lib/api";
import { WorklogForm } from "../../../components/WorklogForm";
import { Worklog } from "@/lib/types";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/Card";

export default function EditWorklogPage() {
  const params = useParams();
  const [worklog, setWorklog] = useState<Worklog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorklog();
  }, [params.id]);

  const loadWorklog = async () => {
    try {
      const wl = await worklogApi.getWorklog(Number(params.id));
      setWorklog(wl);
    } catch (error) {
      console.error("Failed to load worklog:", error);
      toast.error("Failed to load worklog");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!worklog) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <p className="text-gray-500">Worklog not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Worklog</h1>
        <p className="text-gray-600">Update your work activity</p>
      </div>

      <WorklogForm worklog={worklog} />
    </div>
  );
}
