import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  RefreshCw,
  XCircle,
  HelpCircle,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import { usePantry } from '../context/PantryContext';
import { AddEditItemModal } from '../components/pantry/AddEditItemModal';
import { DeleteConfirmModal } from '../components/pantry/DeleteConfirmModal';
import { MarkWastedModal } from '../components/pantry/MarkWastedModal';
import { getExpiryStatus, formatExpiryLabel, formatDateDisplay, extractWasteReason } from '../utils/dateUtils';
import { CarrotDoodle, AvocadoDoodle } from '../components/common/KawaiiDoodles';

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

const CATEGORIES = [
  'All',
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Grains',
  'Canned & Packaged',
  'Snacks & Sweets',
  'Beverages',
  'Frozen',
  'Condiments & Spices',
  'Other'
];

const STORAGE_FILTERS = ['All Locations', 'Fridge', 'Freezer', 'Pantry', 'Countertop'];

export const PantryPage = () => {
  const {
    items,
    loading,
    error,
    notification,
    dismissNotification,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setItemStatus,
  } = usePantry();

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [storageFilter, setStorageFilter] = useState('All Locations');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expiring' | 'expired' | 'consumed'
  const [sortBy, setSortBy] = useState('expiry_asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [wastingItem, setWastingItem] = useState(null);

  // Filtered and Sorted items
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Status filter
        const expiryStatus = getExpiryStatus(item.expiry_date);
        if (statusFilter === 'active' && item.status !== 'active') return false;
        if (statusFilter === 'consumed' && item.status !== 'consumed') return false;
        if (statusFilter === 'wasted' && item.status !== 'wasted') return false;
        if (statusFilter === 'expiring' && (item.status !== 'active' || expiryStatus !== 'expiring')) return false;
        if (statusFilter === 'expired' && (item.status !== 'active' || expiryStatus !== 'expired')) return false;

        // Category filter
        if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

        // Storage filter
        if (storageFilter !== 'All Locations' && item.storage_location !== storageFilter) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          return new Date(a.expiry_date) - new Date(b.expiry_date);
        }
        if (sortBy === 'expiry_desc') {
          return new Date(b.expiry_date) - new Date(a.expiry_date);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'qty_desc') {
          return b.quantity - a.quantity;
        }
        return 0;
      });
  }, [items, search, categoryFilter, storageFilter, statusFilter, sortBy]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (editingItem) {
      await updateItem(editingItem.id, formData);
    } else {
      await addItem(formData);
    }
  };

  const handleOpenDelete = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleToggleConsumed = async (item) => {
    const newStatus = item.status === 'consumed' ? 'active' : 'consumed';
    await setItemStatus(item.id, newStatus);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-sm transition-all ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={dismissNotification}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Major Heading: Outfit Bold 700 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2E24] flex items-center gap-2">
            <span>Pantry Inventory</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#DCEBDD] text-[#315C45] font-semibold border border-[#c2dec5]">
              {items.length} {items.length === 1 ? 'grocery' : 'groceries'}
            </span>
          </h1>
          {/* Body Text: Outfit Normal 400 */}
          <p className="text-sm text-[#343A35] mt-1 font-normal">
            Keep tabs on freshness, prevent food waste, and organize your kitchen staples.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pinterest Grid vs. Table View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border-2 border-[#EADDC7] shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Pinterest Moodboard Grid View"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-[#315C45] text-white shadow-xs'
                  : 'text-[#66736A] hover:text-[#1E2E24]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Classic Table View"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-[#315C45] text-white shadow-xs'
                  : 'text-[#66736A] hover:text-[#1E2E24]'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Table</span>
            </button>
          </div>

          <button
            onClick={fetchItems}
            disabled={loading}
            title="Refresh pantry items"
            className="p-3 rounded-2xl border-2 border-[#EADDC7] bg-white hover:bg-[#FFF9EF] text-[#315C45] transition-all shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#315C45]' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 cursor-pointer font-semibold shadow-kawaii"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Grocery</span>
          </button>
        </div>
      </div>

      {/* Chunky Status Filter Tabs (Outfit Semibold 600) */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#EADDC7]/70 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#315C45] text-white shadow-[0_3px_0_#244634] border border-[#244634]'
              : 'bg-white border-2 border-[#EADDC7] text-[#343A35] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          All Items ({items.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-[#315C45] text-white shadow-[0_3px_0_#244634] border border-[#244634]'
              : 'bg-white border-2 border-[#EADDC7] text-[#343A35] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          Active Stock ({items.filter((i) => i.status === 'active').length})
        </button>
        <button
          onClick={() => setStatusFilter('expiring')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'expiring'
              ? 'bg-[#F4D98A] text-[#7A531C] shadow-[0_3px_0_#D4AD42] border border-[#E2BC55]'
              : 'bg-white border-2 border-[#EADDC7] text-[#9C542E] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          Expiring Soon (
          {items.filter((i) => i.status === 'active' && getExpiryStatus(i.expiry_date) === 'expiring').length}
          )
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'expired'
              ? 'bg-[#D97B5B] text-white shadow-[0_3px_0_#B55F43] border border-[#B55F43]'
              : 'bg-white border-2 border-[#EADDC7] text-[#C05435] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          Expired (
          {items.filter((i) => i.status === 'active' && getExpiryStatus(i.expiry_date) === 'expired').length}
          )
        </button>
        <button
          onClick={() => setStatusFilter('consumed')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'consumed'
              ? 'bg-[#DCEBDD] text-[#315C45] shadow-[0_3px_0_#B5D0B8] border border-[#C2DEC5]'
              : 'bg-white border-2 border-[#EADDC7] text-[#343A35] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          Consumed ({items.filter((i) => i.status === 'consumed').length})
        </button>
        <button
          onClick={() => setStatusFilter('wasted')}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'wasted'
              ? 'bg-[#FEE8E2] text-[#C05435] shadow-[0_3px_0_#F8C8BD] border border-[#F8C8BD]'
              : 'bg-white border-2 border-[#EADDC7] text-[#C05435] shadow-[0_3px_0_#EADDC7] hover:-translate-y-0.5 hover:bg-[#FFF9EF] active:translate-y-1 active:shadow-none'
          }`}
        >
          Wasted ({items.filter((i) => i.status === 'wasted').length})
        </button>
      </div>

      {/* Search and Filters Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#EADDC7] shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736A]" />
          <input
            type="text"
            placeholder="Search groceries by name, category, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EADDC7] text-sm text-[#343A35] placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-[#315C45]/20 focus:border-[#315C45]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736A] hover:text-[#343A35] text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-[#EADDC7] text-sm bg-white text-[#343A35] font-medium focus:outline-none focus:ring-2 focus:ring-[#315C45]/20"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Storage Location Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={storageFilter}
            onChange={(e) => setStorageFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-[#EADDC7] text-sm bg-white text-[#343A35] font-medium focus:outline-none focus:ring-2 focus:ring-[#315C45]/20"
          >
            {STORAGE_FILTERS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div className="w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-[#EADDC7] text-sm bg-white text-[#343A35] focus:outline-none focus:ring-2 focus:ring-[#315C45]/20 font-medium"
          >
            <option value="expiry_asc">Expiry (Earliest First)</option>
            <option value="expiry_desc">Expiry (Furthest First)</option>
            <option value="name_asc">Name (A to Z)</option>
            <option value="qty_desc">Quantity (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Inventory Items: Pinterest Grid or Classic Table */}
      {loading && items.length === 0 ? (
        <div className="card-pinterest p-16 text-center">
          <AvocadoDoodle className="w-14 h-16 mx-auto mb-3" animated />
          <p className="text-base font-display font-bold text-[#1E2E24]">Checking pantry shelves...</p>
          <p className="text-sm text-[#526056] mt-1 font-display font-medium">Retrieving fresh grocery items</p>
        </div>
      ) : processedItems.length === 0 ? (
        /* Cute Pinterest Playful Empty State with 3D Market Basket */
        <div className="card-pinterest p-12 text-center max-w-md mx-auto flex flex-col items-center">
          <div className="w-28 h-28 mb-3 rounded-3xl overflow-hidden shadow-pinterest-card border-2 border-[#EADDC7]">
            <img
              src="/assets/3d_market_basket.jpg"
              alt="Grocery Basket"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-display font-bold text-xl text-[#1E2E24] mb-1">
            {search || categoryFilter !== 'All' || storageFilter !== 'All Locations' || statusFilter !== 'all'
              ? 'No matching groceries found!'
              : 'Your pantry is clean & hungry!'}
          </h3>
          <p className="text-sm text-[#526056] mb-6 leading-relaxed font-display font-medium">
            {search || categoryFilter !== 'All' || storageFilter !== 'All Locations' || statusFilter !== 'all'
              ? 'Try tweaking your search term or resetting your category filters.'
              : 'Start tracking grocery expiration dates and prevent food waste by adding your first grocery item!'}
          </p>

          {search || categoryFilter !== 'All' || storageFilter !== 'All Locations' || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setStorageFilter('All Locations');
                setStatusFilter('all');
              }}
              className="btn-secondary text-xs px-5 py-2.5 cursor-pointer font-semibold"
            >
              Reset All Filters
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="btn-primary flex items-center gap-2 text-sm mx-auto px-6 py-3 cursor-pointer font-semibold shadow-kawaii"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Grocery</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Pinterest-Inspired Aesthetic Grocery Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {processedItems.map((item, idx) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
            const expiryLabel = formatExpiryLabel(item.expiry_date);
            const isConsumed = item.status === 'consumed';
            const isWasted = item.status === 'wasted';
            const wasteReason = isWasted ? extractWasteReason(item.notes) : null;
            const isExp = expiryStatus === 'expired';
            const isExpSoon = expiryStatus === 'expiring';

            return (
              <div
                key={item.id}
                className={`card-pinterest flex flex-col justify-between transition-all duration-200 p-5 ${
                  isConsumed || isWasted
                    ? 'opacity-65 bg-[#FFFDF9]/60'
                    : isExp
                    ? 'bg-[#FEE8E2]/50 border-[#F8C8BD]'
                    : isExpSoon
                    ? 'bg-[#FFF9EF] border-[#F4D98A]'
                    : 'bg-white'
                }`}
              >
                {/* Decorative washi tape depending on status */}
                {isExp ? (
                  <div className="washi-tape-peach" />
                ) : isExpSoon ? (
                  <div className="washi-tape-butter" />
                ) : (
                  <div className="washi-tape-sage" />
                )}

                <div>
                  {/* Top row: Category emoji pill + Storage pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF9EF] border border-[#EADDC7] text-xs font-bold text-[#1E2E24] shadow-2xs">
                      <span className="text-base select-none">{getCategoryEmoji(item.category)}</span>
                      <span>{item.category}</span>
                    </span>

                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#A8BEA0]/25 text-[#315C45] font-semibold border border-[#A8BEA0]/50">
                      {item.storage_location}
                    </span>
                  </div>

                  {/* Title & Consumed Toggle Check */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <button
                      type="button"
                      onClick={() => handleToggleConsumed(item)}
                      title={isConsumed ? 'Mark as active' : 'Mark as consumed'}
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                        isConsumed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-[#C2DEC5] hover:border-[#315C45] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-display font-bold text-base text-[#1E2E24] leading-snug truncate ${
                          isConsumed || isWasted ? 'line-through text-[#66736A]' : ''
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      {item.is_low_stock && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          🧺 Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Optional Price per Unit */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-xl bg-[#F7F1E5] text-[#343A35] font-semibold border border-[#EADDC7]">
                      Qty: <strong className="text-[#1E2E24]">{item.quantity}</strong> {item.unit}
                    </span>
                    {item.price_per_unit !== null && item.price_per_unit !== undefined && item.price_per_unit !== '' && (
                      <span className="text-xs px-2 py-0.5 rounded-xl bg-[#F3C7AE]/35 text-[#9C542E] font-bold border border-[#F3C7AE]">
                        ₹{Number(item.price_per_unit).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Shelf-Life & Status Badge */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-xs font-semibold text-[#1E2E24]">
                        {formatDateDisplay(item.expiry_date)}
                      </span>
                      {isWasted ? (
                        <span className="text-[11px] font-semibold text-[#C05435] bg-[#FEE8E2] px-2 py-0.5 rounded-full border border-[#F8C8BD]">
                          Wasted ({wasteReason || 'Discarded'})
                        </span>
                      ) : isConsumed ? (
                        <span className="text-[11px] font-semibold text-[#526056] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Consumed
                        </span>
                      ) : (
                        <span className={isExp ? 'badge-expired' : isExpSoon ? 'badge-expiring' : 'badge-fresh'}>
                          {expiryLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes if available */}
                  {item.notes && (
                    <p className="text-xs text-[#66736A] bg-[#FFF9EF]/80 p-2 rounded-xl border border-[#EADDC7]/60 line-clamp-2 italic mb-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Quick Actions Footer */}
                <div className="pt-3 border-t border-[#EADDC7]/70 flex items-center justify-between mt-2">
                  <span className="text-[11px] text-[#88968C] font-mono">
                    {item.purchase_date ? `Added ${formatDateDisplay(item.purchase_date)}` : 'In Pantry'}
                  </span>

                  <div className="flex items-center gap-1">
                    {isWasted ? (
                      <button
                        type="button"
                        onClick={() => setItemStatus(item.id, 'active')}
                        title="Restore to Active Pantry"
                        className="p-1.5 rounded-xl text-[#66736A] hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWastingItem(item)}
                        title="Mark as Wasted (Record reason)"
                        className="p-1.5 rounded-xl text-[#66736A] hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Item Details"
                      className="p-1.5 rounded-xl text-[#66736A] hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(item)}
                      title="Delete Item"
                      className="p-1.5 rounded-xl text-[#66736A] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Classic Items Table */
        <div className="card-kawaii overflow-hidden p-0 border-2 border-[#EADDC7]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#343A35]">
              <thead className="bg-[#F8F4EB] border-b-2 border-[#EADDC7] text-xs font-bold text-[#315C45] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Item Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Quantity</th>
                  <th className="px-6 py-3.5">Storage</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDC7]/60">
                {processedItems.map((item) => {
                  const expiryStatus = getExpiryStatus(item.expiry_date);
                  const expiryLabel = formatExpiryLabel(item.expiry_date);
                  const isConsumed = item.status === 'consumed';
                  const isWasted = item.status === 'wasted';
                  const wasteReason = isWasted ? extractWasteReason(item.notes) : null;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FFF9EF]/80 transition-colors ${
                        isConsumed || isWasted ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Name & Notes */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleConsumed(item)}
                            title={isConsumed ? 'Mark as active' : 'Mark as consumed'}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isConsumed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-[#C2DEC5] hover:border-[#315C45] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div>
                            <span
                              className={`font-semibold text-[#1E2E24] ${
                                isConsumed || isWasted ? 'line-through text-[#66736A]' : ''
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.is_low_stock && (
                              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            )}
                            {item.notes && (
                              <p className="text-xs text-[#66736A] truncate max-w-xs mt-0.5">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-xs font-semibold text-[#343A35]">
                        {item.category}
                      </td>

                      {/* Quantity & Unit */}
                      <td className="px-6 py-4 font-semibold text-[#1E2E24]">
                        {item.quantity} <span className="text-xs text-[#526056] font-medium">{item.unit}</span>
                      </td>

                      {/* Storage Location */}
                      <td className="px-6 py-4 text-xs text-[#343A35]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FFF9EF] border border-[#EADDC7] font-semibold text-[#315C45]">
                          {item.storage_location}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-[#1E2E24]">
                          {formatDateDisplay(item.expiry_date)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isWasted ? (
                          <span
                            title={wasteReason ? `Reason: ${wasteReason}` : 'Marked as wasted'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            Wasted ({wasteReason || 'Discarded'})
                          </span>
                        ) : isConsumed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-[#526056] border border-slate-200">
                            Consumed
                          </span>
                        ) : expiryStatus === 'fresh' ? (
                          <span className="badge-fresh">{expiryLabel}</span>
                        ) : expiryStatus === 'expiring' ? (
                          <span className="badge-expiring">{expiryLabel}</span>
                        ) : (
                          <span className="badge-expired">{expiryLabel}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isWasted ? (
                            <button
                              onClick={() => setItemStatus(item.id, 'active')}
                              title="Restore to Active Pantry"
                              className="p-1.5 rounded-lg text-[#66736A] hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setWastingItem(item)}
                              title="Mark as Wasted (Record reason)"
                              className="p-1.5 rounded-lg text-[#66736A] hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item Details"
                            className="p-1.5 rounded-lg text-[#66736A] hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg text-[#66736A] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleModalSubmit}
        initialItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.name || ''}
      />

      {/* Mark Wasted Modal */}
      <MarkWastedModal
        isOpen={Boolean(wastingItem)}
        onClose={() => setWastingItem(null)}
        item={wastingItem}
        onConfirm={(itemId, reason) => setItemStatus(itemId, 'wasted', reason)}
      />
    </div>
  );
};
