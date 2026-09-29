import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ScanLine,
  ChefHat,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Heart
} from 'lucide-react';
import { AvocadoDoodle, SparkleStarDoodle } from './KawaiiDoodles';

export const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '🏠' },
    { to: '/pantry', label: 'Pantry Inventory', icon: Package, emoji: '🧺' },
    { to: '/scanner', label: 'AI Grocery Scanner', icon: ScanLine, badge: 'Vision', emoji: '✨' },
    { to: '/recipes', label: 'AI Recipe Chef', icon: ChefHat, badge: 'Cook', emoji: '🍳' },
    { to: '/analytics', label: 'Waste Analytics', icon: BarChart3, emoji: '📊' },
    { to: '/settings', label: 'Settings & Alerts', icon: Settings, emoji: '🔔' },
  ];

  return (
    <aside className="w-64 bg-[#FFFDF9] border-r-2 border-[#EADDC7]/80 flex flex-col h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#EADDC7]/60 flex items-center gap-3 bg-[#FFF9EF]/60">
        <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] shadow-sm relative group bg-white shrink-0">
          <img src="/assets/3d_avocado.jpg" alt="3D Avocado Mascot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F4D98A] rounded-full border border-white flex items-center justify-center text-[8px] shadow-xs">
            ✨
          </span>
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-[#1E2E24] leading-none flex items-center gap-1.5">
            <span>PantryPal</span>
            <span className="text-[10px] font-display font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#315C45] text-[#FFF9EF]">
              AI
            </span>
          </h1>
          <p className="text-xs text-[#526056] mt-1 font-semibold flex items-center gap-1">
            <span>Cute Zero-Waste Kitchen</span>
            <span className="text-[10px]">🌱</span>
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-display font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#DCEBDD] text-[#315C45] font-bold shadow-sm shadow-[#315C45]/10 border border-[#c2dec5]'
                    : 'text-[#343A35] hover:text-[#1E2E24] hover:bg-[#F7F1E5] font-semibold'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base select-none">{item.emoji}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-display font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#F4D98A]/70 text-[#7A531C] border border-[#F4D98A]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Sign Out Footer */}
      <div className="p-4 border-t border-[#EADDC7]/70 bg-[#FFF9EF]/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="truncate mr-2">
            <p className="text-xs font-display font-bold text-[#1E2E24] truncate flex items-center gap-1">
              <span>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chef Pal'}</span>
            </p>
            <p className="text-xs text-[#526056] font-medium truncate">{user?.email || 'chef@pantrypal.ai'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#DCEBDD] border border-[#315C45]/20 text-[#315C45] flex items-center justify-center font-display font-bold text-xs shadow-sm">
            {(user?.email?.[0] || 'C').toUpperCase()}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#D97B5B] hover:text-[#C05435] bg-white hover:bg-[#FEE8E2] border border-[#F8C8BD] shadow-[0_3px_0_#F8C8BD] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
