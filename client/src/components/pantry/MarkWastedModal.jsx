import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, IndianRupee, Loader2, AlertCircle } from 'lucide-react';
import { calculateItemWasteCost } from '../../utils/dateUtils';

const COMMON_REASONS = [
  'Spoiled / Moldy',
  'Past Expiry Date',
  'Smelled bad / Off taste',
  'Forgot in back of fridge',
  'Leftover not finished',
  'Bought too much',
  'Damaged / Bruised',
  'Other'
];

export const MarkWastedModal = ({
  isOpen,
  onClose,
  item = null,
  availableItems = [],
  onConfirm
}) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Safe valid available items list
  const safeAvailable = (availableItems || []).filter(Boolean);

  // Initialize or reset selected item when modal opens
  useEffect(() => {
    if (isOpen) {
      if (item?.id) {
        setSelectedItemId(item.id);
      } else if (safeAvailable.length > 0) {
        setSelectedItemId(safeAvailable[0].id);
      } else {
        setSelectedItemId('');
      }
      setReason(COMMON_REASONS[0]);
      setCustomNote('');
      setError(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, item?.id]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Determine active item object
  const currentItem = item || safeAvailable.find((i) => i.id === selectedItemId);
  const estimatedCost = currentItem ? calculateItemWasteCost(currentItem) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Please select a valid inventory item to mark as wasted.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const fullReason = reason === 'Other' && customNote.trim()
        ? `Other (${customNote.trim()})`
        : customNote.trim()
          ? `${reason} - ${customNote.trim()}`
          : reason;

      await onConfirm(currentItem.id, fullReason);
      onClose();
    } catch (err) {
      console.error('[MarkWastedModal] Failed to mark item as wasted:', err);
      // Keep modal open and display a helpful error message to user
      setError(err?.message || 'Failed to record waste item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-kawaii-espresso/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop to dismiss on outside click */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!submitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 bg-[#FFFDF9] rounded-3xl max-w-lg w-full shadow-2xl border border-kawaii-border p-6 flex flex-col my-auto max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-[#66736A] hover:text-kawaii-espresso hover:bg-kawaii-border/40 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-kawaii-terracotta/15 text-kawaii-terracotta flex items-center justify-center shrink-0 border border-kawaii-terracotta/30 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-kawaii-espresso">Log Wasted Item</h3>
            <p className="text-sm text-[#343A35] font-normal mt-0.5">Record discarded food to track waste patterns and losses.</p>
          </div>
        </div>

        {/* Error message banner if operation fails */}
        {error && (
          <div className="mb-4 p-3.5 bg-kawaii-terracotta/15 rounded-2xl border border-kawaii-terracotta/30 text-xs text-kawaii-terracotta flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-kawaii-terracotta shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-kawaii-terracotta">Failed to Record Waste</p>
              <p className="mt-0.5 text-kawaii-terracotta/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection (if not locked to one specific item) */}
          {item ? (
            <div className="bg-white p-4 rounded-2xl border border-kawaii-border shadow-xs">
              <span className="text-xs font-bold text-[#315C45] uppercase tracking-wider block mb-1">
                Selected Item
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-kawaii-espresso text-base">{item.name}</p>
                  <p className="text-xs text-[#526056] font-medium mt-0.5">
                    {item.category} • {item.quantity} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#66736A] block font-bold">Est. Loss</span>
                  {typeof estimatedCost === 'number' && !isNaN(estimatedCost) ? (
                    <span className="font-bold text-kawaii-terracotta text-sm">₹{estimatedCost.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-[#66736A] italic font-medium">Price not added</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
                Choose Item to Mark as Wasted
              </label>
              {safeAvailable.length === 0 ? (
                <div className="p-3.5 bg-white rounded-2xl text-xs text-[#526056] border border-kawaii-border font-medium">
                  No active items available to mark as wasted.
                </div>
              ) : (
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm bg-white text-kawaii-espresso focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest shadow-xs font-medium cursor-pointer"
                  required
                >
                  {safeAvailable.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity} {i.unit}) - {i.category}
                    </option>
                  ))}
                </select>
              )}

              {currentItem && (
                <div className="mt-2.5 p-3 bg-white rounded-2xl border border-kawaii-border flex items-center justify-between text-xs shadow-xs">
                  <span className="text-[#526056] font-bold">Estimated Cost:</span>
                  {typeof estimatedCost === 'number' && !isNaN(estimatedCost) ? (
                    <span className="font-bold text-kawaii-terracotta">₹{estimatedCost.toFixed(2)}</span>
                  ) : (
                    <span className="text-[#66736A] italic font-medium">Price not added</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Waste Reason */}
          <div>
            <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
              Why was this food wasted?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_REASONS.map((r) => {
                const isSelected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-3 py-2.5 rounded-2xl text-xs text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-kawaii-terracotta bg-kawaii-terracotta/15 text-kawaii-terracotta font-bold shadow-xs'
                        : 'border-kawaii-border hover:border-kawaii-forest/40 text-kawaii-espresso bg-white font-medium'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1.5">
              Additional Details <span className="text-[#66736A] font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. opened 2 weeks ago, forgot in vegetable drawer..."
              className="w-full px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest shadow-xs font-medium"
            />
          </div>

          {/* Cost impact alert */}
          <div className="p-3.5 bg-kawaii-butter/30 rounded-2xl border border-[#E2BC55]/40 flex items-start gap-2.5">
            <IndianRupee className="w-4 h-4 text-[#8A5B10] shrink-0 mt-0.5" />
            <div className="text-xs text-[#6B460C]">
              <span className="font-bold">Financial Impact:</span>{' '}
              {typeof estimatedCost === 'number' && !isNaN(estimatedCost) ? (
                <>
                  Marking this item as wasted will record an estimated loss of{' '}
                  <strong className="text-kawaii-terracotta">₹{estimatedCost.toFixed(2)}</strong> in your analytics.
                </>
              ) : (
                <>
                  This item has no recorded price. No financial loss will be counted.
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-kawaii-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs px-4 py-2.5 cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !currentItem}
              className="btn-terracotta text-xs px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Waste Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

