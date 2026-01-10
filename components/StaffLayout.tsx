import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ArrowLeft } from "lucide-react";
import { StaffSidebar } from "./StaffSidebar";
import { clearStaffAuthToken } from "../utils/cookies";

interface StaffLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  profile: { firstName: string; lastName: string } | null;
  onLogout: () => void;
  currentPath: string;
  showBackButton?: boolean;
  backPath?: string;
  backLabel?: string;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  children,
  title,
  subtitle,
  profile,
  onLogout,
  currentPath,
  showBackButton = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStaffAuthToken();
    onLogout();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <StaffSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        currentPath={currentPath}
      />

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
           
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold border border-green-300">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
