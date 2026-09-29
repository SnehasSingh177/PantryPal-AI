import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  const [deleting, setDeleting] = useState(false);

  // Prevent background scrolling while modal is open
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
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
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
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 bg-[#FFFDF9] rounded-3xl max-w-md w-full shadow-2xl border border-kawaii-border p-6 flex flex-col my-auto max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-[#66736A] hover:text-kawaii-espresso hover:bg-kawaii-border/40 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-kawaii-terracotta/15 text-kawaii-terracotta flex items-center justify-center shrink-0 border border-kawaii-terracotta/30 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xl text-kawaii-espresso">Remove Grocery Item?</h3>
            <p className="text-xs text-[#66736A] font-medium">This action cannot be undone.</p>
          </div>
        </div>

        {/* Description Body */}
        <p className="text-sm text-[#343A35] leading-relaxed mb-6 bg-kawaii-cream/60 p-4 rounded-2xl border border-kawaii-border/60 font-normal">
          Are you sure you want to permanently remove <strong className="text-kawaii-espresso">"{itemName}"</strong> from your organic pantry inventory?
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-auto pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn-secondary text-xs px-4 py-2.5 cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-terracotta text-xs px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Remove Item</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

