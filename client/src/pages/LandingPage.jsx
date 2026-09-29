import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import {
  Sparkles,
  ScanLine,
  ChefHat,
  BellRing,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  ShoppingBag
} from 'lucide-react';
import {
  AvocadoDoodle,
  StrawberryDoodle,
  CarrotDoodle,
  LemonDoodle,
  LeafDoodle,
  SparkleStarDoodle,
  KawaiiBackgroundDoodles
} from '../components/common/KawaiiDoodles';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#1E2E24] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#F4D98A] selection:text-[#315C45]">
      {/* Ambient Floating Kawaii Doodles */}
      <KawaiiBackgroundDoodles />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DCEBDD] border border-[#c2dec5] text-[#315C45] text-xs font-display font-bold mb-6 shadow-sm animate-fade-in">
              <SparkleStarDoodle className="w-4 h-4" fill="#315C45" />
              <span>Pinterest Kitchen AI • Zero Food Waste Made Cute & Cozy</span>
            </div>

            {/* Main Headline (Outfit Bold 700) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E2E24] tracking-tight leading-[1.18]">
              Cook with joy & never waste groceries with{' '}
              <span className="relative inline-block text-[#315C45]">
                PantryPal AI
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 9C50 2 150 2 198 9" stroke="#F4D98A" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subheading (Outfit 400-500) */}
            <p className="mt-6 text-base sm:text-lg text-[#343A35] leading-relaxed max-w-2xl mx-auto font-normal">
              Scan your grocery basket with <strong className="font-semibold text-[#1E2E24]">AI Vision</strong>, track freshness before items spoil, and whip up delicious zero-waste meals with your friendly <strong className="font-semibold text-[#1E2E24]">AI Chef</strong>.
            </p>

            {/* 3D Food Mascots Cluster */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 mt-7 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] shadow-sm transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all">
                <img src="/assets/3d_avocado.jpg" alt="3D Avocado" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#F3C7AE] shadow-sm transform -translate-y-2 hover:translate-y-0 hover:scale-105 transition-all">
                <img src="/assets/3d_chef_strawberry.jpg" alt="3D Chef Strawberry" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#EADDC7] shadow-sm transform rotate-3 hover:rotate-0 hover:scale-105 transition-all">
                <img src="/assets/3d_market_basket.jpg" alt="3D Market Basket" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#F4D98A] shadow-sm transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all">
                <img src="/assets/3d_lemon.jpg" alt="3D Lemon" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#D97B5B]/30 shadow-sm transform rotate-6 hover:rotate-0 hover:scale-105 transition-all hidden sm:block">
                <img src="/assets/3d_carrot.jpg" alt="3D Carrot" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Bold Chunky CTA Buttons (Outfit Semibold 600) */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2.5 font-semibold shadow-md"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto btn-secondary text-base px-8 py-3.5 flex items-center justify-center gap-2 font-semibold shadow-xs"
              >
                <span>Explore My Pantry</span>
                <span className="text-base">🥑</span>
              </Link>
            </div>

            {/* Feature Highlights Trust Row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-display font-bold text-[#315C45]">
              <div className="flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-[#c2dec5] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#315C45]" />
                <span>AI Basket Vision</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-[#c2dec5] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#315C45]" />
                <span>Automated Expiry Alerts</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-[#c2dec5] shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#315C45]" />
                <span>Zero-Waste AI Recipes</span>
              </div>
            </div>
          </div>

          {/* Interactive UI Mockup Card (Pinterest Kitchen Moodboard) */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-white border-2 border-[#EADDC7] shadow-pinterest-card overflow-hidden p-3 sm:p-5 relative">
            <div className="washi-tape-peach -top-2.5 right-10 hidden sm:block">Kitchen Dashboard Pin 📌</div>

            <div className="bg-[#FFFDF9] rounded-2xl border border-[#EADDC7]/80 p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EADDC7]/60 pb-4 mb-6 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] shadow-xs shrink-0">
                    <img src="/assets/3d_avocado.jpg" alt="Avocado Mascot" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-display font-bold text-[#1E2E24]">
                      Your Live Kitchen Radar
                    </h3>
                    <p className="text-sm text-[#343A35] font-normal">Real-time shelf life monitoring & cute zero-waste suggestions</p>
                  </div>
                </div>
                <span className="badge-fresh self-start sm:self-auto">
                  <span>Fresh & Active</span>
                </span>
              </div>

              {/* Sample Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Expiring Soon Card */}
                <div className="card-pinterest p-4 bg-[#FFF9EF] border-2 border-[#F4D98A] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥛</span>
                      <span className="text-xs font-display font-bold text-[#1E2E24]">Organic Milk</span>
                    </div>
                    <span className="badge-expiring text-[10px]">Expires in 2 days</span>
                  </div>
                  <div className="h-2 w-full bg-[#EADDC7]/50 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-[#D97B5B] w-3/4 rounded-full" />
                  </div>
                  <p className="text-xs text-[#526056] mt-2 font-semibold">Fridge • 1 Liter remaining</p>
                </div>

                {/* Fresh Card */}
                <div className="card-pinterest p-4 bg-[#DCEBDD]/30 border-2 border-[#c2dec5] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥑</span>
                      <span className="text-xs font-display font-bold text-[#1E2E24]">Ripe Avocados</span>
                    </div>
                    <span className="badge-fresh text-[10px]">Fresh (5 days left)</span>
                  </div>
                  <div className="h-2 w-full bg-[#c2dec5]/60 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-[#315C45] w-1/3 rounded-full" />
                  </div>
                  <p className="text-xs text-[#526056] mt-2 font-semibold">Countertop • 3 pieces</p>
                </div>

                {/* AI Chef Recipe Recommendation */}
                <div className="card-pinterest p-4 bg-[#FFFDF9] border-2 border-[#F3C7AE] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg overflow-hidden border border-[#D97B5B]/30">
                        <img src="/assets/3d_chef_strawberry.jpg" alt="Chef" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-display font-bold text-[#D97B5B]">Chef Pal Pick</span>
                    </div>
                    <p className="text-xs font-display font-bold text-[#1E2E24]">Creamy Avocado Pasta</p>
                    <p className="text-xs text-[#343A35] mt-1 leading-snug font-normal">
                      Rescues your expiring milk + ripe avocados!
                    </p>
                  </div>
                  <div className="mt-3">
                    <Link
                      to="/recipes"
                      className="text-xs font-display font-bold text-[#D97B5B] hover:text-[#C05435] flex items-center gap-1"
                    >
                      <span>Let's Cook!</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - Pinterest Moodboard Style */}
      <section id="features" className="py-16 sm:py-20 bg-white/70 border-t-2 border-[#EADDC7]/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#1E2E24]">
              Everything you need for a happy, zero-waste kitchen
            </h2>
            <p className="mt-3 text-base text-[#343A35] font-display font-normal">
              Designed to feel like a cozy modern kitchen counter where nothing gets forgotten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: AI Vision Scanner */}
            <div className="card-pinterest p-6 bg-[#DCEBDD]/30 border-2 border-[#c2dec5] hover:-translate-y-1.5 transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] mb-4 shadow-xs">
                <img src="/assets/3d_market_basket.jpg" alt="Basket Vision" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#1E2E24]">Basket Vision Scanner</h3>
              <p className="text-sm text-[#343A35] mt-2 leading-relaxed font-normal">
                Snap a photo of multiple groceries at once. AI detects names, quantities, and recommended pantry locations.
              </p>
            </div>

            {/* Feature 2: Automated Expiry Radar */}
            <div className="card-pinterest p-6 bg-[#FFF9EF] border-2 border-[#F4D98A] hover:-translate-y-1.5 transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#F4D98A] mb-4 shadow-xs">
                <img src="/assets/3d_lemon.jpg" alt="Expiry Radar" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#1E2E24]">Expiry Radar & Alerts</h3>
              <p className="text-sm text-[#343A35] mt-2 leading-relaxed font-normal">
                Receive scheduled email reminders at 1, 3, or 7 days before items expire so you cook them in time.
              </p>
            </div>

            {/* Feature 3: AI Recipe Chef */}
            <div className="card-pinterest p-6 bg-[#F3C7AE]/25 border-2 border-[#F3C7AE] hover:-translate-y-1.5 transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#D97B5B]/30 mb-4 shadow-xs">
                <img src="/assets/3d_chef_strawberry.jpg" alt="Chef Pal" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#1E2E24]">AI Zero-Waste Chef</h3>
              <p className="text-sm text-[#343A35] mt-2 leading-relaxed font-normal">
                Generates delicious step-by-step recipes specifically utilizing ingredients in your pantry that expire first.
              </p>
            </div>

            {/* Feature 4: Waste Analytics */}
            <div className="card-pinterest p-6 bg-[#F3D9DC]/35 border-2 border-[#F3D9DC] hover:-translate-y-1.5 transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] mb-4 shadow-xs">
                <img src="/assets/3d_recipe_bowl.jpg" alt="Waste Analytics" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-display font-bold text-[#1E2E24]">Waste Analytics (₹)</h3>
              <p className="text-sm text-[#343A35] mt-2 leading-relaxed font-normal">
                Track how much money you save in Indian Rupees (₹) and monitor your household food waste reduction rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cozy Footer */}
      <footer className="mt-auto py-10 bg-[#FFF9EF] border-t-2 border-[#EADDC7]/70 text-center relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AvocadoDoodle className="w-6 h-7" />
            <span className="font-display font-bold text-sm text-[#1E2E24]">PantryPal AI</span>
            <span className="text-xs text-[#526056] font-medium">• Cute Zero-Waste Kitchen</span>
          </div>
          <p className="text-xs text-[#526056] font-medium flex items-center gap-1">
            <span>Made with love</span>
            <Heart className="w-3.5 h-3.5 text-[#D97B5B] fill-current" />
            <span>for delicious, sustainable homes</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
