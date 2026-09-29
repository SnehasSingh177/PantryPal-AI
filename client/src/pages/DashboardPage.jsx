import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  ChefHat,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Heart,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import { AddEditItemModal } from '../components/pantry/AddEditItemModal';
import { getExpiryStatus, formatExpiryLabel, formatDateDisplay } from '../utils/dateUtils';
import {
  AvocadoDoodle,
  StrawberryDoodle,
  CarrotDoodle,
  LemonDoodle,
  SparkleStarDoodle
} from '../components/common/KawaiiDoodles';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { items, stats, loading, fetchItems, addItem } = usePantry();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const chefName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Chef';

  // Active items sorted by expiry date ascending
  const activeItems = items
    .filter((i) => i.status === 'active')
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  // Items expiring within 3 days or already expired
  const urgentItems = activeItems
    .filter((i) => {
      const status = getExpiryStatus(i.expiry_date);
      return status === 'expiring' || status === 'expired';
    })
    .slice(0, 4);

  // Fresh items currently in stock with safe shelf life
  const freshItems = activeItems
    .filter((i) => getExpiryStatus(i.expiry_date) === 'fresh')
    .slice(0, 4);

  // Distinct category count
  const activeCategoriesCount = new Set(activeItems.map((i) => i.category)).size;

  const handleAddSubmit = async (formData) => {
    await addItem(formData);
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'Produce': return '🥦';
      case 'Dairy & Eggs': return '🥛';
      case 'Meat & Seafood': return '🥩';
      case 'Bakery': return '🍞';
      case 'Pantry & Grains': return '🌾';
      case 'Canned & Packaged': return '🥫';
      case 'Snacks & Sweets': return '🍪';
      case 'Beverages': return '🧃';
      case 'Frozen': return '🧊';
      case 'Condiments & Spices': return '🧂';
      default: return '🥑';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in pb-12">
      {/* 1. Pinterest-Inspired Welcoming Hero Section */}
      <div className="card-sage bg-gradient-to-r from-[#FFFDF9] via-[#FFF9EF] to-[#A8BEA0]/20 p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="washi-tape-sage" />

        <div className="flex items-center gap-4 sm:gap-5 relative z-10">
          {/* Cute 3D Food Character (Friendly Avocado waving hello) */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#DCEBDD] border-2 border-[#A8BEA0] p-1 flex items-center justify-center shadow-pinterest-card relative shrink-0 group hover:scale-105 transition-transform">
            <img
              src="/assets/3d_avocado.jpg"
              alt="Cute 3D Avocado Mascot"
              className="w-full h-full object-cover rounded-xl"
            />
            <span className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-xs border border-[#A8BEA0]">
              <SparkleStarDoodle className="w-3.5 h-3.5" fill="#F4D98A" animated />
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#A8BEA0]/25 text-[#315C45] text-xs font-display font-bold mb-1 border border-[#A8BEA0]/50">
              <Sparkles className="w-3 h-3 text-[#315C45]" />
              <span>Kitchen Mood: Cozy & Fresh</span>
              <span>✨</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1E2E24] tracking-tight">
              Hey, Pantry Bestie! 👋
            </h1>
            <p className="text-sm text-[#343A35] mt-0.5 font-normal">
              {urgentItems.length > 0
                ? `You have ${urgentItems.length} grocery item(s) to enjoy before they spoil. Let's make something delicious!`
                : `Welcome back, ${chefName}! All your pantry groceries are fresh, organized, and happy.`}
            </p>
          </div>
        </div>

        {/* Quick Action Bold Chunky Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={fetchItems}
            disabled={loading}
            title="Refresh pantry inventory"
            className="p-2.5 rounded-2xl border-2 border-[#A8BEA0]/60 bg-white hover:bg-[#FFF9EF] text-[#315C45] transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#315C45]' : ''}`} />
          </button>
          <Link
            to="/scanner"
            className="btn-secondary text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2 font-semibold shadow-xs"
          >
            <ScanLine className="w-4 h-4 text-[#315C45]" />
            <span>Scan Basket</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs sm:text-sm px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Grocery</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Pinterest Statistic Cards with Balanced Proportions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Items (Sage Green) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#A8BEA0]/20 border-2 border-[#A8BEA0]/70 shadow-pinterest-card flex items-center justify-between hover:-translate-y-0.5 hover:shadow-pinterest-hover transition-all relative overflow-hidden group">
          <div className="washi-tape-sage" />
          <div>
            <p className="text-xs font-display font-bold text-[#315C45] uppercase tracking-wider">Total Groceries</p>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-[#1E2E24] mt-1">
              {loading && items.length === 0 ? '...' : stats.total}
            </p>
            <span className="text-xs text-[#315C45] font-display font-semibold flex items-center gap-1 mt-0.5">
              <span>🧺</span>
              <span>{activeCategoriesCount} {activeCategoriesCount === 1 ? 'category' : 'categories'} in stock</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-[#315C45] flex items-center justify-center border border-[#A8BEA0]/60 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Expiring Soon (Butter Yellow) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#F4D98A]/25 border-2 border-[#F4D98A] shadow-pinterest-card flex items-center justify-between hover:-translate-y-0.5 hover:shadow-pinterest-hover transition-all relative overflow-hidden group">
          <div className="washi-tape-butter" />
          <div>
            <p className="text-xs font-display font-bold text-[#9C542E] uppercase tracking-wider">Expiring Soon</p>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-[#9C542E] mt-1">
              {loading && items.length === 0 ? '...' : stats.expiringSoon}
            </p>
            <span className="text-xs text-[#9C542E] font-display font-semibold flex items-center gap-1 mt-0.5">
              <span>⏰</span>
              <span>Within next 3 days</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-[#D97B5B] flex items-center justify-center border border-[#F4D98A] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Expired Items (Soft Terracotta & Peach) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#F3C7AE]/30 border-2 border-[#D97B5B]/60 shadow-pinterest-card flex items-center justify-between hover:-translate-y-0.5 hover:shadow-pinterest-hover transition-all relative overflow-hidden group">
          <div className="washi-tape-peach" />
          <div>
            <p className="text-xs font-display font-bold text-[#A8381D] uppercase tracking-wider">Past Expiry</p>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-[#A8381D] mt-1">
              {loading && items.length === 0 ? '...' : stats.expired}
            </p>
            <span className="text-xs text-[#A8381D] font-display font-semibold flex items-center gap-1 mt-0.5">
              <span>🍂</span>
              <span>Needs review / cook</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-[#D9534F] flex items-center justify-center border border-[#F3C7AE] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Fresh Ratio (Soft Pink) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#F3D9DC]/35 border-2 border-[#E7BAC1] shadow-pinterest-card flex items-center justify-between hover:-translate-y-0.5 hover:shadow-pinterest-hover transition-all relative overflow-hidden group">
          <div>
            <p className="text-xs font-display font-bold text-[#6D3D48] uppercase tracking-wider">Fresh Ratio</p>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-[#6D3D48] mt-1">
              {loading && items.length === 0
                ? '...'
                : stats.total > 0
                ? `${Math.round((stats.fresh / stats.total) * 100)}%`
                : '100%'}
            </p>
            <span className="text-xs text-[#6D3D48] font-display font-semibold flex items-center gap-1 mt-0.5">
              <span>🌿</span>
              <span>{stats.fresh} fresh of {stats.total} total</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-[#8C4656] flex items-center justify-center border border-[#E7BAC1] shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Main Content: Urgent Expiry Radar + AI Recipe Chef */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
        {/* Urgent Expiry Radar (2 columns, adaptive height, no random empty space) */}
        <div className="lg:col-span-2 card-sage p-5 sm:p-6 flex flex-col justify-between">
          <div className="washi-tape-sage" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EADDC7]/70">
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#1E2E24] flex items-center gap-2">
                <span>Urgent Expiry Radar</span>
                <span className="text-base">⏰</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#343A35] font-normal mt-0.5">
                Groceries that should be cooked or enjoyed first
              </p>
            </div>
            <Link
              to="/pantry"
              className="text-xs font-display font-bold text-[#315C45] hover:text-[#264936] flex items-center gap-1 bg-[#A8BEA0]/25 px-3 py-1.5 rounded-full border border-[#A8BEA0]/50 hover:bg-[#A8BEA0]/40 transition-colors shrink-0"
            >
              <span>View All Pantry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Content: Adaptive to item count to avoid vertical dead zones */}
          {urgentItems.length === 0 ? (
            /* Compact, Cute Empty State with 3D Lemon Mascot */
            <div className="card-dashed p-5 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xs border-2 border-[#F4D98A] bg-white shrink-0">
                <img
                  src="/assets/3d_lemon.jpg"
                  alt="Happy Fresh Lemon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-base font-display font-bold text-[#1E2E24] flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Everything is crisp & fresh!</span>
                  <span>✨</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#343A35] mt-0.5 max-w-md font-normal">
                  {activeItems.length > 0
                    ? `All ${activeItems.length} groceries in your pantry have safe shelf life remaining. No food waste today!`
                    : 'Your pantry is clean and ready. Add fresh groceries or scan a shopping haul to get started.'}
                </p>
              </div>
            </div>
          ) : urgentItems.length === 1 ? (
            /* Single Urgent Item: Full-Width Cozy Banner (no empty right half) */
            <div className="space-y-3">
              {urgentItems.map((item) => {
                const status = getExpiryStatus(item.expiry_date);
                const isExp = status === 'expired';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
                      isExp
                        ? 'border-[#F8C8BD] bg-[#FEE8E2]/60'
                        : 'border-[#F4D98A] bg-[#FFF9EF]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xs shrink-0 ${
                          isExp
                            ? 'bg-white text-[#C05435] border border-[#F8C8BD]'
                            : 'bg-white text-[#9C542E] border border-[#F4D98A]'
                        }`}
                      >
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div>
                        <h4 className="text-base font-display font-bold text-[#1E2E24] leading-snug">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/80 text-[#343A35] font-semibold border border-[#EADDC7]">
                            Qty: {item.quantity} {item.unit}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/80 text-[#343A35] font-semibold border border-[#EADDC7]">
                            {item.storage_location}
                          </span>
                          <span className="text-xs text-[#88968C] font-mono">
                            Expires {formatDateDisplay(item.expiry_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <span className={isExp ? 'badge-expired' : 'badge-expiring'}>
                        {formatExpiryLabel(item.expiry_date)}
                      </span>
                      <Link
                        to="/recipes"
                        className="btn-terracotta text-xs px-3.5 py-1.5 flex items-center gap-1 font-semibold"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Cook</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 2 to 4 Urgent Items: Compact, Evenly-Proportioned 2-Column Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {urgentItems.map((item) => {
                const status = getExpiryStatus(item.expiry_date);
                const isExp = status === 'expired';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-2.5 transition-all shadow-xs ${
                      isExp
                        ? 'border-[#F8C8BD] bg-[#FEE8E2]/60'
                        : 'border-[#F4D98A] bg-[#FFF9EF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs shrink-0 ${
                          isExp
                            ? 'bg-white text-[#C05435] border border-[#F8C8BD]'
                            : 'bg-white text-[#9C542E] border border-[#F4D98A]'
                        }`}
                      >
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-display font-bold text-[#1E2E24] truncate leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#526056] font-medium mt-0.5 truncate">
                          {item.quantity} {item.unit} • {item.storage_location}
                        </p>
                        <p className="text-[10px] text-[#88968C] font-mono mt-0.5">
                          {formatDateDisplay(item.expiry_date)}
                        </p>
                      </div>
                    </div>
                    <span className={isExp ? 'badge-expired shrink-0 text-[10px]' : 'badge-expiring shrink-0 text-[10px]'}>
                      {formatExpiryLabel(item.expiry_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Recipe Chef Quick Card with Warm Terracotta Border */}
        <div className="card-terracotta p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="washi-tape-peach" />

          <div>
            {/* Header badges */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5 text-[#D97B5B] text-xs font-display font-bold uppercase tracking-wider bg-[#D97B5B]/15 px-3 py-1 rounded-full border border-[#D97B5B]/30">
                <ChefHat className="w-3.5 h-3.5 text-[#D97B5B]" />
                <span>AI Recipe Chef</span>
              </div>
              <span className="text-xs font-bold text-[#D97B5B] bg-white px-2.5 py-0.5 rounded-full border border-[#F3C7AE] shadow-xs">
                Zero-Waste ✨
              </span>
            </div>

            {/* 3D Chef Strawberry Mascot */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto my-2 rounded-2xl overflow-hidden shadow-xs border-2 border-[#D97B5B]/40 p-0.5 bg-white hover:scale-105 transition-transform">
              <img
                src="/assets/3d_chef_strawberry.jpg"
                alt="Chef Pal Strawberry"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <h3 className="text-lg font-display font-bold text-[#1E2E24] text-center mt-1">
              {urgentItems.length > 0
                ? `Rescue ${urgentItems[0].name}!`
                : activeItems.length > 0
                ? `Cook with ${activeItems[0].name}`
                : 'Smart Pantry Chef'}
            </h3>

            <p className="text-xs sm:text-sm text-[#343A35] mt-1.5 leading-relaxed font-normal text-center">
              {urgentItems.length > 0 ? (
                <>
                  Turn your expiring <strong className="text-[#1E2E24]">{urgentItems[0].name}</strong> into an aesthetic, zero-waste meal before it spoils.
                </>
              ) : activeItems.length > 0 ? (
                <>
                  You have <strong className="text-[#1E2E24]">{activeItems.length} active ingredients</strong> ready in your pantry. Let's make lunch!
                </>
              ) : (
                'Add ingredients to your pantry and Chef Pal will craft customized zero-waste recipes.'
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EADDC7]/70">
            <Link
              to="/recipes"
              className="w-full btn-terracotta flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5 font-bold shadow-md cursor-pointer"
            >
              <ChefHat className="w-4 h-4" />
              <span>Let's Cook!</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Balanced Kitchen Inventory Glance (Eliminates bottom void & gives a Pinterest moodboard feel) */}
      <div className="card-sage p-5 sm:p-6">
        <div className="washi-tape-sage" />

        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EADDC7]/70">
          <div>
            <h3 className="text-lg font-display font-bold text-[#1E2E24] flex items-center gap-2">
              <span>Fresh in Your Pantry</span>
              <span className="text-base">🌿</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#343A35] font-normal mt-0.5">
              Quick glance at healthy groceries currently in stock
            </p>
          </div>
          <Link
            to="/pantry"
            className="text-xs font-display font-bold text-[#315C45] hover:text-[#264936] flex items-center gap-1 bg-[#A8BEA0]/20 px-3 py-1.5 rounded-full border border-[#A8BEA0]/50 hover:bg-[#A8BEA0]/35 transition-colors"
          >
            <span>Manage All ({activeItems.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeItems.length === 0 ? (
          <div className="card-dashed p-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#EADDC7] shadow-xs mb-2 bg-white">
              <img src="/assets/3d_market_basket.jpg" alt="Pantry Basket" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-display font-bold text-[#1E2E24]">No groceries logged in your pantry yet</p>
            <p className="text-xs text-[#343A35] mt-0.5">Click "+ Add Grocery" or "Scan Basket" above to add your first grocery items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {activeItems.slice(0, 4).map((item) => {
              const status = getExpiryStatus(item.expiry_date);
              const isExp = status === 'expired';
              const isExpSoon = status === 'expiring';

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white border-2 border-[#EADDC7] hover:border-[#A8BEA0] shadow-xs transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="w-9 h-9 rounded-xl bg-[#FFF9EF] border border-[#EADDC7] flex items-center justify-center text-lg shrink-0">
                      {getCategoryEmoji(item.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-display font-bold text-[#1E2E24] truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#526056] font-medium mt-0.5">
                        {item.quantity} {item.unit} • {item.storage_location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EADDC7]/60 text-xs">
                    <span className="text-[11px] text-[#88968C] font-mono">
                      {formatDateDisplay(item.expiry_date)}
                    </span>
                    <span className={isExp ? 'badge-expired text-[10px]' : isExpSoon ? 'badge-expiring text-[10px]' : 'badge-fresh text-[10px]'}>
                      {formatExpiryLabel(item.expiry_date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddEditItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
};

