import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { KawaiiBackgroundDoodles } from './KawaiiDoodles';

export const DashboardLayout = () => {
  const { isConfigured } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#FFF9EF] text-[#1E2E24] relative selection:bg-[#F4D98A] selection:text-[#315C45]">
      {/* Ambient Kawaii Floating Food Doodles */}
      <KawaiiBackgroundDoodles />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        {/* Notice Banner if Supabase is awaiting configuration */}
        {!isConfigured && (
          <div className="bg-[#D97B5B] text-white px-4 py-2.5 text-xs font-display font-medium flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Preview Mode:</strong> Cloud database credentials not detected. The application is running in local preview mode.
              </span>
            </div>
            <span className="text-[11px] bg-[#B85E40] px-2 py-0.5 rounded-full font-bold">Local Active</span>
          </div>
        )}

        <main className="flex-1 p-5 sm:p-7 lg:p-9 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
