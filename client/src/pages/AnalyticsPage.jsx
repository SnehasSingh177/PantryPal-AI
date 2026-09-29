import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  AlertTriangle,
  Trash2,
  IndianRupee,
  BarChart3,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { usePantry } from '../context/PantryContext';
import {
  getExpiryStatus,
  formatDateDisplay,
  calculateItemWasteCost,
  extractWasteReason
} from '../utils/dateUtils';
import { MarkWastedModal } from '../components/pantry/MarkWastedModal';
import { CarrotDoodle, SparkleStarDoodle, LeafDoodle, AvocadoDoodle } from '../components/common/KawaiiDoodles';

export const AnalyticsPage = () => {
  const { items, loading, stats, setItemStatus, fetchItems } = usePantry();

  // Modal state for recording waste
  const [isWastedModalOpen, setIsWastedModalOpen] = useState(false);
  const [selectedItemToWaste, setSelectedItemToWaste] = useState(null);

  // Safe valid items collection (filters out any unexpected null or undefined records)
  const safeItems = useMemo(() => (items || []).filter(Boolean), [items]);

  // Wasted, active, and consumed item subsets
  const wastedItems = useMemo(() => safeItems.filter((i) => i.status === 'wasted'), [safeItems]);
  const activeItems = useMemo(() => safeItems.filter((i) => i.status === 'active'), [safeItems]);
  const consumedItems = useMemo(() => safeItems.filter((i) => i.status === 'consumed'), [safeItems]);

  // Inventory Status Chart Data (Fresh, Expiring Soon, Expired, Consumed, Wasted)
  const statusChartData = useMemo(() => {
    let freshCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    activeItems.forEach((item) => {
      if (!item?.expiry_date) {
        freshCount++;
        return;
      }
      const s = getExpiryStatus(item.expiry_date);
      if (s === 'fresh') freshCount++;
      else if (s === 'expiring') expiringCount++;
      else if (s === 'expired') expiredCount++;
    });

    return [
      {
        name: 'Fresh',
        count: freshCount,
        fill: '#315C45', // Forest green
        desc: 'Safe & good to use'
      },
      {
        name: 'Expiring Soon',
        count: expiringCount,
        fill: '#F4D98A', // Butter yellow
        desc: 'Expires within 3 days'
      },
      {
        name: 'Expired',
        count: expiredCount,
        fill: '#D97B5B', // Terracotta
        desc: 'Past shelf life'
      },
      {
        name: 'Consumed',
        count: consumedItems.length,
        fill: '#5F9B72', // Soft mint sage
        desc: 'Eaten or cooked'
      },
      {
        name: 'Wasted',
        count: wastedItems.length,
        fill: '#C85A3F', // Deep terracotta
        desc: 'Discarded or spoiled'
      }
    ];
  }, [activeItems, consumedItems, wastedItems]);

  // Open modal to mark an item as wasted
  const handleOpenMarkWaste = (item = null) => {
    setSelectedItemToWaste(item);
    setIsWastedModalOpen(true);
  };

  // Confirm waste recording
  const handleConfirmWaste = async (itemId, reason) => {
    await setItemStatus(itemId, 'wasted', reason);
    try {
      if (typeof fetchItems === 'function') {
        await fetchItems();
      }
    } catch (e) {
      console.warn('[AnalyticsPage] Background data sync note:', e);
    }
  };

  // Restore item back to active pantry
  const handleRestoreActive = async (itemId) => {
    await setItemStatus(itemId, 'active');
    try {
      if (typeof fetchItems === 'function') {
        await fetchItems();
      }
    } catch (e) {
      console.warn('[AnalyticsPage] Background data sync note:', e);
    }
  };

  // Summary counts
  const totalItemsCount = stats?.totalPantry ?? safeItems.length;
  const activeItemsCount = stats?.total ?? activeItems.length;
  const expiringSoonCount = stats?.expiringSoon ?? 0;
  const expiredCount = stats?.expired ?? 0;
  const wastedCount = stats?.wasted ?? wastedItems.length;
  const totalWasteCost = stats?.estimatedWasteCost ?? 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative z-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#A8BEA0] shadow-sm bg-white shrink-0">
            <img src="/assets/3d_recipe_bowl.jpg" alt="Analytics" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1E2E24]">
                Pantry & Waste Analytics
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCEBDD] text-[#315C45] font-bold border border-[#c2dec5] shadow-xs">
                Live Pantry Data 🌱
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#343A35] font-normal mt-0.5 leading-relaxed">
              Track pantry inventory health, food sustainability, and prevent kitchen waste.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchItems}
            disabled={loading}
            title="Refresh analytics metrics"
            className="p-3 rounded-2xl border border-kawaii-border bg-white hover:bg-kawaii-cream text-kawaii-forest transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-kawaii-forest' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenMarkWaste(null)}
            className="btn-terracotta flex items-center gap-2 text-sm cursor-pointer shadow-kawaii-terracotta font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Track Wasted Item</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Items */}
        <div className="card-kawaii p-5 bg-[#DCEBDD]/40 border-kawaii-border/80 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-kawaii-forest">Total Items</span>
            <div className="w-8 h-8 rounded-xl bg-kawaii-forest text-white flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-kawaii-espresso">{totalItemsCount}</p>
            <p className="text-xs text-[#315C45] font-semibold mt-1">
              <strong>{activeItemsCount}</strong> active in pantry
            </p>
          </div>
        </div>

        {/* 2. Expiring Soon */}
        <div className="card-kawaii p-5 bg-[#F4D98A]/35 border-[#E2BC55]/40 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A5B10]">Expiring Soon</span>
            <div className="w-8 h-8 rounded-xl bg-kawaii-butter text-kawaii-espresso flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-[#8A5B10]">{expiringSoonCount}</p>
            <p className="text-xs text-[#8A5B10] font-semibold mt-1">Expires in 3 days ⏰</p>
          </div>
        </div>

        {/* 3. Expired */}
        <div className="card-kawaii p-5 bg-[#D97B5B]/15 border-[#D97B5B]/30 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-kawaii-terracotta">Expired</span>
            <div className="w-8 h-8 rounded-xl bg-kawaii-terracotta text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-kawaii-terracotta">{expiredCount}</p>
            <p className="text-xs text-kawaii-terracotta font-semibold mt-1">
              {expiredCount > 0 ? 'Needs disposal or cook' : 'Clean pantry! ✨'}
            </p>
          </div>
        </div>

        {/* 4. Wasted Items */}
        <div className="card-kawaii p-5 bg-[#E8DFF5]/60 border-[#D4C3EE]/50 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#694A94]">Wasted Items</span>
            <div className="w-8 h-8 rounded-xl bg-kawaii-lavender text-[#583C80] flex items-center justify-center shadow-xs">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-[#583C80]">{wastedCount}</p>
            <p className="text-xs text-[#583C80] font-semibold mt-1">Discarded items logged</p>
          </div>
        </div>

        {/* 5. Estimated Waste Cost */}
        <div className="card-kawaii p-5 bg-white border-kawaii-border/80 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#315C45]">Est. Waste Cost</span>
            <div className="w-8 h-8 rounded-xl bg-kawaii-mint/80 text-kawaii-forest flex items-center justify-center shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            {(stats?.itemsWithWasteCost ?? 0) > 0 ? (
              <>
                <p className="text-3xl font-display font-bold text-kawaii-terracotta">
                  ₹{Number(totalWasteCost || 0).toFixed(2)}
                </p>
                <p className="text-xs text-[#526056] font-medium mt-1">
                  {stats?.itemsWithWasteCost === wastedCount
                    ? `From all ${wastedCount} priced ${wastedCount === 1 ? 'item' : 'items'}`
                    : `From ${stats?.itemsWithWasteCost} of ${wastedCount} priced items`}
                </p>
              </>
            ) : wastedCount > 0 ? (
              <>
                <p className="text-xl font-display font-bold text-[#66736A]">
                  Price not added
                </p>
                <p className="text-xs text-[#526056] font-medium mt-1">
                  Add prices to items to track exact loss
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-display font-bold text-kawaii-forest">
                  ₹0.00
                </p>
                <p className="text-xs text-kawaii-forest font-semibold mt-1">Zero loss! Great job! 🎉</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Status Breakdown Chart */}
      <div className="card-kawaii p-6 bg-white border-kawaii-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-kawaii-espresso flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-kawaii-forest" />
              <span>Inventory Status Breakdown</span>
            </h2>
            <p className="text-sm text-[#343A35] mt-1 font-normal leading-relaxed">
              Live distribution of items in your organic pantry.
            </p>
          </div>

          <div className="text-xs text-kawaii-forest font-bold bg-kawaii-mint/60 px-3.5 py-1.5 rounded-full border border-kawaii-forest/20">
            Total Tracked: <strong>{totalItemsCount} items</strong>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-72 w-full my-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={statusChartData}
              margin={{ top: 20, right: 20, left: -15, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADDC7" strokeOpacity={0.6} />
              <XAxis
                dataKey="name"
                stroke="#343A35"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#EADDC7' }}
              />
              <YAxis
                stroke="#343A35"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(220, 235, 221, 0.4)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0]?.payload) {
                    const data = payload[0].payload;
                    const pct = totalItemsCount > 0 ? Math.round((data.count / totalItemsCount) * 100) : 0;
                    return (
                      <div className="bg-kawaii-espresso text-white px-4 py-3 rounded-2xl shadow-xl text-xs border border-white/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: data.fill }}
                          />
                          <span className="font-display font-bold text-sm text-white">{data.name}</span>
                        </div>
                        <p className="text-[#FFF9EF]">
                          Count: <strong className="text-white font-bold">{data.count}</strong> items ({pct}%)
                        </p>
                        <p className="text-kawaii-mint text-[11px] mt-0.5">{data.desc}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[12, 12, 0, 0]} maxBarSize={60}>
                {statusChartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Indicators Pills */}
        <div className="mt-4 pt-4 border-t border-kawaii-border/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-kawaii-mint/50 border border-kawaii-forest/20 text-kawaii-forest font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-kawaii-forest shrink-0" />
            <span className="truncate">Fresh: <strong>{statusChartData[0]?.count ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-kawaii-butter/40 border border-[#E2BC55]/40 text-[#8A5B10] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2BC55] shrink-0" />
            <span className="truncate">Expiring: <strong>{statusChartData[1]?.count ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-kawaii-terracotta shrink-0" />
            <span className="truncate">Expired: <strong>{statusChartData[2]?.count ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#5F9B72]/15 border border-[#5F9B72]/30 text-[#305C3E] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5F9B72] shrink-0" />
            <span className="truncate">Consumed: <strong>{statusChartData[3]?.count ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#C85A3F]/15 border border-[#C85A3F]/30 text-[#A63D24] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C85A3F] shrink-0" />
            <span className="truncate">Wasted: <strong>{statusChartData[4]?.count ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Simple Waste History Section */}
      <div className="card-kawaii bg-white border-kawaii-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-kawaii-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold text-kawaii-espresso flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-kawaii-terracotta" />
              <span>Waste History Log</span>
            </h2>
            <p className="text-sm text-[#343A35] mt-1 font-normal leading-relaxed">
              Record of discarded grocery items, reported reasons, and estimated cost in ₹.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1.5 bg-[#FFF9EF] text-kawaii-forest rounded-full border border-kawaii-border">
              {wastedItems.length} {wastedItems.length === 1 ? 'Item' : 'Items'} Recorded
            </span>
            <button
              onClick={() => handleOpenMarkWaste(null)}
              className="btn-terracotta text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Waste</span>
            </button>
          </div>
        </div>

        {wastedItems.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-kawaii-mint/60 border border-kawaii-forest/20 flex items-center justify-center mx-auto mb-4 animate-kawaii-sway">
              <CarrotDoodle className="w-10 h-10" />
            </div>
            <h4 className="font-display font-bold text-kawaii-espresso text-base">Zero Waste Recorded! 🎉</h4>
            <p className="text-sm text-[#343A35] mt-1.5 leading-relaxed font-normal">
              Your pantry is running in tip-top shape! When items expire or spoil, you can log them here to learn and improve.
            </p>
            <button
              onClick={() => handleOpenMarkWaste(null)}
              className="btn-secondary mt-5 text-xs py-2 px-4 cursor-pointer font-semibold"
            >
              Track an Item as Wasted
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-kawaii-espresso">
              <thead className="bg-[#FFF9EF] border-b border-kawaii-border text-xs font-bold text-kawaii-forest uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Reason for Waste</th>
                  <th className="px-6 py-4">Estimated Cost</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kawaii-border/50">
                {wastedItems.map((item) => {
                  if (!item) return null;
                  const reason = extractWasteReason(item.notes);
                  const cost = calculateItemWasteCost(item);

                  return (
                    <tr key={item.id} className="hover:bg-kawaii-cream/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-kawaii-espresso block">{item.name}</span>
                        {item.expiry_date && (
                          <span className="text-xs text-[#66736A] font-medium">
                            Expiry: {formatDateDisplay(item.expiry_date)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#343A35] font-medium">{item.category || 'Other'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-kawaii-espresso">
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-kawaii-terracotta/15 text-kawaii-terracotta border border-kawaii-terracotta/30">
                          {reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {typeof cost === 'number' && !isNaN(cost) ? (
                          <span className="font-bold text-sm text-kawaii-terracotta">
                            ₹{cost.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#66736A] italic font-medium bg-[#FFF9EF] px-2.5 py-0.5 rounded-full border border-kawaii-border">
                            Price not added
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestoreActive(item.id)}
                          title="Restore item back to active pantry"
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          Restore 🌱
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Waste Prevention Tips (Kawaii Organic Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tip 1: AI Recipe Rescue */}
        <div className="card-kawaii p-6 bg-gradient-to-br from-white to-kawaii-mint/30 border-kawaii-border flex flex-col justify-between relative overflow-hidden">
          <div className="w-2 bg-kawaii-forest absolute left-0 top-0 bottom-0" />
          <div>
            <div className="flex items-center gap-2 mb-2 text-kawaii-forest">
              <Sparkles className="w-4 h-4 shrink-0 text-kawaii-terracotta animate-kawaii-wiggle" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Recipe Rescue</span>
            </div>
            <h4 className="font-display font-bold text-kawaii-espresso text-base mb-1.5">
              Cook With Expiring Ingredients 🍲
            </h4>
            <p className="text-sm text-[#343A35] leading-relaxed font-normal">
              Use PantryPal AI to automatically generate delicious meals from groceries expiring soon,
              turning surplus pantry items into culinary masterpieces!
            </p>
          </div>
          <Link
            to="/recipes"
            className="btn-primary mt-5 inline-flex items-center justify-center gap-2 text-xs py-2.5 px-5 self-start font-semibold"
          >
            <span>Let's Cook! 🍳</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tip 2: Storage Best Practices */}
        <div className="card-kawaii p-6 bg-gradient-to-br from-white to-kawaii-butter/25 border-kawaii-border flex flex-col justify-between relative overflow-hidden">
          <div className="w-2 bg-kawaii-butter absolute left-0 top-0 bottom-0" />
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8A5B10]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-kawaii-forest" />
              <span className="text-xs font-bold uppercase tracking-wider">First-In, First-Out (FIFO)</span>
            </div>
            <h4 className="font-display font-bold text-kawaii-espresso text-base mb-1.5">
              Smart Storage Organization 🧺
            </h4>
            <p className="text-sm text-[#343A35] leading-relaxed font-normal">
              Place newly purchased groceries behind older ones so older items are consumed first.
              Keep refrigerated greens in breathable containers to preserve crisp freshness.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-kawaii-border/60 text-xs text-[#343A35] flex items-center gap-1.5 font-medium">
            <LeafDoodle className="w-4 h-4 text-kawaii-forest shrink-0" />
            <span>Pro Tip: Store ethylene-producing fruits (like bananas) separately from leafy greens!</span>
          </div>
        </div>
      </div>

      {/* Mark Wasted Modal */}
      <MarkWastedModal
        isOpen={isWastedModalOpen}
        onClose={() => {
          setIsWastedModalOpen(false);
          setSelectedItemToWaste(null);
        }}
        item={selectedItemToWaste}
        availableItems={activeItems}
        onConfirm={handleConfirmWaste}
      />
    </div>
  );
};

