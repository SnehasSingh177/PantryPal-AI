import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AvocadoDoodle, SparkleStarDoodle } from './KawaiiDoodles';

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-[#FFF9EF]/90 backdrop-blur-md border-b-2 border-[#EADDC7]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] shadow-sm relative group-hover:scale-105 transition-transform bg-white shrink-0">
              <img src="/assets/3d_avocado.jpg" alt="3D Avocado Mascot" className="w-full h-full object-cover" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F4D98A] rounded-full border border-white flex items-center justify-center text-[8px] shadow-xs">
                ✨
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl sm:text-2xl text-[#1E2E24] tracking-tight flex items-center gap-1.5">
                <span>PantryPal</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#315C45] text-[#FFF9EF] font-bold">
                  AI
                </span>
              </span>
              <span className="text-[11px] text-[#526056] -mt-1 font-display font-bold tracking-wide">
                CUTE ZERO-WASTE KITCHEN
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-display font-bold text-[#343A35] hover:text-[#315C45] transition-colors">
              Pantry Radar
            </a>
            <a href="#recipes" className="text-sm font-display font-bold text-[#343A35] hover:text-[#315C45] transition-colors">
              AI Chef
            </a>
            <a href="#scanner" className="text-sm font-display font-bold text-[#343A35] hover:text-[#315C45] transition-colors">
              Basket Scanner
            </a>
            <a href="#impact" className="text-sm font-display font-bold text-[#343A35] hover:text-[#315C45] transition-colors">
              Zero-Waste Impact
            </a>
          </div>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                <span>Go to Kitchen</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-display font-bold text-[#315C45] hover:text-[#264936] px-3.5 py-2 rounded-2xl hover:bg-[#F7F1E5] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm flex items-center gap-2 px-5 py-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#F4D98A]" />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
