"use client";

import { useState, useEffect } from "react";
import {
  Building,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  Mail,
  Info,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { departmentApi, authApi } from "@/lib/api";
import {
  DepartmentHierarchy,
  DepartmentSummary,
  User as UserType,
} from "@/lib/types";
import { toast } from "react-hot-toast";
import { extractErrorMessage } from "@/lib/error-handler";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeamNodeProps {
  team: DepartmentHierarchy["teams"][0];
  searchTerm: string;
  forceExpanded?: boolean;
}

function TeamNode({ team, searchTerm, forceExpanded }: TeamNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Update expansion state when forceExpanded changes
  useEffect(() => {
    if (forceExpanded !== undefined) {
      setIsExpanded(forceExpanded);
    }
  }, [forceExpanded]);

  // Auto-expand if search matches team or members
  useEffect(() => {
    if (searchTerm) {
      const teamMatches = team.teamLeadName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const memberMatches = team.members.some((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (teamMatches || memberMatches) {
        setIsExpanded(true);
      }
    }
  }, [searchTerm, team]);

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="ml-8 mt-4">
      <Card className="border-blue-200 bg-blue-50">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                )}
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {highlightText(team.teamLeadName)}
                  </h3>
                  <span className="text-m text-gray-900">Team Lead</span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-m text-gray-900">
                  <span className="flex items-center text-l">
                    <Mail className="h-4 w-4 mr-1" />
                    {team.teamLeadEmail}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {team.teamSize} members
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/employees/${team.teamLeadId}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Profile
            </Button>
          </div>

          {isExpanded && team.members.length > 0 && (
            <div className="mt-4 ml-8 space-y-2">
              {team.members.map((member) => (
                <Link
                  key={member.id}
                  href={`/employees/${member.id}`}
                  className="block"
                >
                  <Card className="border-gray-900 hover:border-blue-300 hover:shadow-lg transition-all">
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-900" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {highlightText(member.name)}
                            </p>
                            <p className="text-m text-gray-900">
                              {member.grade} • {member.email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function DepartmentHierarchyPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null
  );
  const [hierarchy, setHierarchy] = useState<DepartmentHierarchy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // "none" -> force all teams to collapse
  // "all" -> force all teams to expand
  // "user" -> let each team to decide for itself (default)
  const [expandState, setExpandState] = useState<"none" | "all" | "user">(
    "user"
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadHierarchy(selectedDepartment);
    }
  }, [selectedDepartment]);

  const loadInitialData = async () => {
    try {
      const [currentUser, depts] = await Promise.all([
        authApi.getCurrentUser(),
        departmentApi.getAllDepartments(),
      ]);
      setUser(currentUser);
      setDepartments(depts);

      // Auto-select user's department
      const userDept = depts.find((d) => d.id === currentUser.departmentId);
      if (userDept) {
        setSelectedDepartment(userDept.id);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHierarchy = async (departmentId: number) => {
    try {
      const data = await departmentApi.getDepartmentHierarchy(departmentId);
      setHierarchy(data);
    } catch (error) {
      console.error("Failed to load hierarchy:", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const exportHierarchy = () => {
    if (!hierarchy) return;

    const data = {
      department: hierarchy.department,
      departmentCode: hierarchy.departmentCode,
      director: hierarchy.director,
      totalEmployees: hierarchy.totalEmployees,
      totalTeamLeads: hierarchy.totalTeamLeads,
      teams: hierarchy.teams.map((team) => ({
        teamLead: team.teamLeadName,
        teamLeadEmail: team.teamLeadEmail,
        teamSize: team.teamSize,
        members: team.members.map((m) => ({
          name: m.name,
          email: m.email,
          grade: m.grade,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hierarchy.departmentCode}_hierarchy.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExpandToggle = () => {
    if (expandState === "all") {
      setExpandState("none");
    } else {
      setExpandState("all");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If not a director, show access denied
  if (!user || user.role !== "DIRECTOR") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <div className="p-6 text-center">
            <Building className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              This page is only accessible to directors.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Department Organization Chart
        </h1>
        <p className="mt-2 text-gray-900">
          Visual representation of department structure
        </p>
      </div>

      {/* Department Selector and Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={selectedDepartment || ""}
          onChange={(e) => setSelectedDepartment(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name} ({dept.employeeCount} employees)
            </option>
          ))}
        </select>

        {hierarchy && (
          <>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 w-4 text-gray-900" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={handleExpandToggle}>
              {expandState === "all" ? "Collapse All" : "Expand All"}
            </Button>

            <Button variant="secondary" size="sm" onClick={exportHierarchy}>
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
          </>
        )}
      </div>

      {/* Hierarchy Display */}
      {hierarchy && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-200 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-m font-medium text-blue-600">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {hierarchy.totalEmployees}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-200 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-m font-medium text-green-600">
                    Team Leads
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {hierarchy.totalTeamLeads}
                  </p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-m font-medium text-purple-600">
                    Avg Team Size
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {hierarchy.totalTeamLeads > 0
                      ? (
                          (hierarchy.totalEmployees - 1) /
                          hierarchy.totalTeamLeads
                        ).toFixed(1)
                      : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Organization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{hierarchy.department} Organization Chart</CardTitle>
            </CardHeader>
            <div className="p-6">
              {/* Director */}
              {hierarchy.director && (
                <Link href={`/employees/${hierarchy.director.id}`}>
                  <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building className="h-6 w-6 text-green-600" />
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {hierarchy.director.name}
                            </h2>
                            <p className="text-m text-gray-900">
                              Director • {hierarchy.director.email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-8 w-8 text-blue-600 hover:bg-blue-100 rounded" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Teams */}
              {hierarchy.teams.map((team) => (
                <TeamNode
                  key={team.teamLeadId}
                  team={team}
                  searchTerm={searchTerm}
                  forceExpanded={
                    expandState === "all"
                      ? true
                      : expandState === "none"
                      ? false
                      : undefined
                  }
                />
              ))}

              {/* Info Box */}
              {hierarchy.teams.length === 0 && (
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">No teams found</p>
                      <p className="mt-1">
                        This department doesn't have any team leads assigned
                        yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
