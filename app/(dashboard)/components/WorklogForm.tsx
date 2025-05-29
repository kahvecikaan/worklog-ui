"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { worklogApi, worklogTypeApi } from "@/lib/api";
import { WorklogCreateRequest, WorklogType } from "@/lib/types";

const worklogSchema = z.object({
  worklogTypeId: z.string().min(1, "Please select a work type"),
  workDate: z.string().min(1, "Please select a date"),
  hoursWorked: z
    .string()
    .min(1, "Hours worked is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 24,
      {
        message: "Hours must be between 0 and 24",
      }
    ),
  projectName: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type WorklogFormData = z.infer<typeof worklogSchema>;

interface WorklogFormProps {
  worklog?: any; // For edit mode
}

export function WorklogForm({ worklog }: WorklogFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [worklogTypes, setWorklogTypes] = useState<WorklogType[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorklogFormData>({
    resolver: zodResolver(worklogSchema),
    defaultValues: {
      worklogTypeId: worklog?.worklogTypeId?.toString() || "",
      workDate: worklog?.workDate || format(new Date(), "yyyy-MM-dd"),
      hoursWorked: worklog?.hoursWorked?.toString() || "",
      projectName: worklog?.projectName || "",
      description: worklog?.description || "",
    },
  });

  useEffect(() => {
    loadWorklogTypes();
  }, []);

  const loadWorklogTypes = async () => {
    try {
      const types = await worklogTypeApi.getActiveTypes();
      setWorklogTypes(types);
    } catch (error) {
      console.error("Failed to load worklog types:", error);
      toast.error("Failed to load work types");
    }
  };

  const onSubmit = async (data: WorklogFormData) => {
    setIsLoading(true);
    try {
      const payload: WorklogCreateRequest = {
        worklogTypeId: Number(data.worklogTypeId),
        workDate: data.workDate,
        hoursWorked: Number(data.hoursWorked),
        projectName: data.projectName || "",
        description: data.description,
      };

      if (worklog) {
        await worklogApi.updateWorklog(worklog.id, payload);
        toast.success("Worklog updated successfully");
      } else {
        await worklogApi.createWorklog(payload);
        toast.success("Worklog created successfully");
      }

      router.push("/worklogs");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to save worklog:", error);
      toast.error(error.response?.data?.message || "Failed to save worklog");
    } finally {
      setIsLoading(false);
    }
  };

  const worklogTypeOptions = worklogTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Work Type"
            options={worklogTypeOptions}
            {...register("worklogTypeId")}
            error={errors.worklogTypeId?.message}
          />

          <Input
            label="Date"
            type="date"
            {...register("workDate")}
            error={errors.workDate?.message}
            max={format(new Date(), "yyyy-MM-dd")}
          />

          <Input
            label="Hours Worked"
            type="number"
            step="0.5"
            min="0"
            max="24"
            {...register("hoursWorked")}
            error={errors.hoursWorked?.message}
            placeholder="e.g., 8"
          />

          <Input
            label="Project Name (Optional)"
            {...register("projectName")}
            error={errors.projectName?.message}
            placeholder="e.g., Kron Worklog System"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className={`
              w-full px-3 py-2 border rounded-lg shadow-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.description ? "border-red-500" : "border-gray-300"}
            `}
            placeholder="Describe what you worked on..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : worklog
              ? "Update Worklog"
              : "Create Worklog"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/worklogs")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
