"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Home, FileText, Users, LogOut, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import { User as UserType } from "@/lib/types";
import { getRoleDisplayName, canViewTeamData } from "@/lib/auth";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Worklogs", href: "/worklogs", icon: FileText },
  ];

  // Add team navigation for Team Leads and Directors
  if (user && canViewTeamData(user)) {
    navigation.push({ name: "Team", href: "/team", icon: Users });
  }

  const isActive = (href: string) => pathname === href;

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            {/* Logo and title section */}
            <div className="flex flex-shrink-0 items-center">
              <Image
                src="/images/kron_logo.png"
                alt="Kron Tech"
                width={60}
                height={60}
                className="mr-3"
                priority
              />
              <h1 className="text-xl font-bold text-gray-900">
                Worklog Tracking System
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      inline-flex items-center px-1 pt-1 text-sm font-medium
                      ${
                        isActive(item.href)
                          ? "border-b-2 border-blue-500 text-gray-900"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName(user.role)}
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full text-white font-semibold">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="ml-3"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    block pl-3 pr-4 py-2 text-base font-medium
                    ${
                      isActive(item.href)
                        ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user && (
              <div className="flex items-center px-4 mb-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full text-white font-semibold">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {getRoleDisplayName(user.role)}
                  </div>
                </div>
              </div>
            )}
            <div className="px-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
