"use client";

import { WorklogForm } from "../../components/WorklogForm";

export default function NewWorklogPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Worklog</h1>
        <p className="text-gray-600">Record your work activities</p>
      </div>

      <WorklogForm />
    </div>
  );
}
