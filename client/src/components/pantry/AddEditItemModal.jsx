import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save, Loader2, AlertCircle } from 'lucide-react';
import { getQuickFutureDate } from '../../utils/dateUtils';

const CATEGORIES = [
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

const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry', 'Countertop'];

const COMMON_UNITS = ['pcs', 'kg', 'g', 'liters', 'ml', 'packs', 'cans', 'loaves', 'bottles'];

const getFreshState = () => ({
  name: '',
  category: 'Produce',
  quantity: '1',
  unit: 'pcs',
  price_per_unit: '',
  purchase_date: new Date().toISOString().split('T')[0],
  expiry_date: getQuickFutureDate(7),
  storage_location: 'Fridge',
  notes: '',
  is_low_stock: false,
});

export const AddEditItemModal = ({ isOpen, onClose, onSubmit, initialItem = null }) => {
  const isEditing = Boolean(initialItem);

  const [formData, setFormData] = useState(getFreshState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock background scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Initialize or reset form every time modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        // Edit mode: populate with existing item data
        let initialPrice = '';
        if (initialItem.price_per_unit !== undefined && initialItem.price_per_unit !== null) {
          initialPrice = String(initialItem.price_per_unit);
        } else if (initialItem.notes) {
          const match = initialItem.notes.match(/\[Price:\s*([0-9.]+)\]/i);
          if (match) initialPrice = match[1];
        }

        setFormData({
          name: initialItem.name || '',
          category: initialItem.category || 'Produce',
          quantity: initialItem.quantity ? String(initialItem.quantity) : '1',
          unit: initialItem.unit || 'pcs',
          price_per_unit: initialPrice,
          purchase_date: initialItem.purchase_date || new Date().toISOString().split('T')[0],
          expiry_date: initialItem.expiry_date || getQuickFutureDate(7),
          storage_location: initialItem.storage_location || 'Fridge',
          notes: initialItem.notes ? initialItem.notes.replace(/\[Price:\s*[0-9.]+\]\s*/i, '').trim() : '',
          is_low_stock: Boolean(initialItem.is_low_stock),
        });
      } else {
        // Add mode: always start completely fresh with clean empty fields
        setFormData(getFreshState());
      }
      setError('');
    }
  }, [isOpen, initialItem]);

  const handleClose = () => {
    setFormData(getFreshState());
    setError('');
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Map grocery_name back to name state while bypassing browser autocomplete heuristics
    const stateKey = name === 'grocery_name' ? 'name' : name;
    setFormData((prev) => ({
      ...prev,
      [stateKey]: type === 'checkbox' ? checked : value,
    }));
  };

  const setPresetExpiry = (days) => {
    setFormData((prev) => ({
      ...prev,
      expiry_date: getQuickFutureDate(days),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!formData.expiry_date) {
      setError('Expiry date is required.');
      return;
    }
    if (parseFloat(formData.quantity) <= 0 || isNaN(parseFloat(formData.quantity))) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const priceVal = formData.price_per_unit !== '' && !isNaN(parseFloat(formData.price_per_unit))
      ? parseFloat(formData.price_per_unit)
      : null;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        price_per_unit: priceVal,
      });
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // Render modal directly into document.body using React Portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-kawaii-espresso/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop to dismiss on outside click */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 bg-[#FFFDF9] rounded-3xl max-w-lg w-full shadow-2xl border-2 border-[#EADDC7] flex flex-col my-auto max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Decorative Tape */}
        <div className="washi-tape-peach -top-2.5 left-10 hidden sm:block">Pantry Log 📌</div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EADDC7] bg-[#FFF9EF]">
          <div>
            <h3 className="font-display font-bold text-xl text-[#1E2E24] flex items-center gap-2">
              <span>{isEditing ? '✏️ Edit Grocery Item' : '🧺 Add to Pantry'}</span>
            </h3>
            <p className="text-sm text-[#343A35] font-normal">
              {isEditing ? 'Update details in your pantry inventory' : 'Track fresh ingredients in your pantry'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#66736A] hover:text-[#1E2E24] hover:bg-[#EADDC7]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="add-edit-pantry-form"
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="p-3.5 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
              Item Name <span className="text-kawaii-terracotta">*</span>
            </label>
            <input
              type="text"
              name="grocery_name"
              id="pantry-grocery-name"
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              placeholder="e.g. Organic Avocados"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
            />
          </div>

          {/* Category & Storage Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
                Storage Location
              </label>
              <select
                name="storage_location"
                value={formData.storage_location}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
              >
                {STORAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Optional Price per Unit (₹) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
                Quantity <span className="text-kawaii-terracotta">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                step="any"
                min="0.01"
                required
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Price / Unit</span>
                <span className="text-xs text-[#66736A] font-medium lowercase">optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66736A] text-sm font-bold select-none">
                  ₹
                </span>
                <input
                  type="number"
                  name="price_per_unit"
                  id="pantry-item-price"
                  step="0.01"
                  min="0"
                  placeholder="50.00"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Expiry Date with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider">
                Expiry Date <span className="text-kawaii-terracotta">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#66736A] font-semibold">Quick:</span>
                <button
                  type="button"
                  onClick={() => setPresetExpiry(3)}
                  className="px-2 py-0.5 rounded-full bg-kawaii-cream border border-kawaii-border hover:bg-kawaii-mint text-kawaii-forest font-bold transition-colors cursor-pointer text-xs"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => setPresetExpiry(7)}
                  className="px-2 py-0.5 rounded-full bg-kawaii-cream border border-kawaii-border hover:bg-kawaii-mint text-kawaii-forest font-bold transition-colors cursor-pointer text-xs"
                >
                  +1w
                </button>
                <button
                  type="button"
                  onClick={() => setPresetExpiry(14)}
                  className="px-2 py-0.5 rounded-full bg-kawaii-cream border border-kawaii-border hover:bg-kawaii-mint text-kawaii-forest font-bold transition-colors cursor-pointer text-xs"
                >
                  +2w
                </button>
                <button
                  type="button"
                  onClick={() => setPresetExpiry(30)}
                  className="px-2 py-0.5 rounded-full bg-kawaii-cream border border-kawaii-border hover:bg-kawaii-mint text-kawaii-forest font-bold transition-colors cursor-pointer text-xs"
                >
                  +1m
                </button>
              </div>
            </div>
            <input
              type="date"
              name="expiry_date"
              required
              value={formData.expiry_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest font-sans shadow-xs"
            />
          </div>

          {/* Notes & Low Stock */}
          <div>
            <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              name="notes"
              autoComplete="off"
              placeholder="e.g. Brand, opened date, or recipe ideas"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest transition-colors shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="is_low_stock"
              name="is_low_stock"
              checked={formData.is_low_stock}
              onChange={handleChange}
              className="w-4 h-4 rounded text-kawaii-forest focus:ring-kawaii-forest border-kawaii-border cursor-pointer"
            />
            <label htmlFor="is_low_stock" className="text-sm font-medium text-[#343A35] cursor-pointer select-none">
              Flag as low-stock item 🧺 (triggers shopping reminder)
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-kawaii-border/60 bg-kawaii-cream/80">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="btn-secondary text-xs px-4 py-2 cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-edit-pantry-form"
            disabled={submitting}
            className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : '+ Add Grocery'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

