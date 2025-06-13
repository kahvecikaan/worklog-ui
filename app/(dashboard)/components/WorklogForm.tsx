"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
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
import { extractErrorMessage, isValidationError } from "@/lib/error-handler";
import { AlertCircle } from "lucide-react";

const worklogSchema = z.object({
  worklogTypeId: z.string().min(1, "Please select a work type"),
  workDate: z.string().min(1, "Please select a date"),
  hoursWorked: z
    .string()
    .min(1, "Hours worked is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 8,
      {
        message: "Hours must be between 1 and 8",
      }
    ),
  projectName: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type WorklogFormData = z.infer<typeof worklogSchema>;

interface WorklogFormProps {
  worklog?: any;
}

export function WorklogForm({ worklog }: WorklogFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [worklogTypes, setWorklogTypes] = useState<WorklogType[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const onSubmit: SubmitHandler<WorklogFormData> = async (data) => {
    setIsLoading(true);
    setApiError(null); // Clear previous errors

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

      const errorMessage = extractErrorMessage(error);
      setApiError(errorMessage);

      // Check if it's a validation error to provide more specific handling
      if (isValidationError(error)) {
        // For validation errors, the message is usually descriptive enough
        toast.error(errorMessage, {
          duration: errorMessage.length > 100 ? 6000 : 4000,
        });
      } else {
        // For other errors, keep it brief
        toast.error("Failed to save worklog. Please try again.");
      }
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
        {/* Display API error prominently if it exists */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Error creating worklog
              </h3>
              <p className="text-sm text-red-700 mt-1">{apiError}</p>
            </div>
          </div>
        )}

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
            step="1"
            min="1"
            max="8"
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
