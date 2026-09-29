/**
 * Utility functions for date calculations, formatting, shelf-life status, and waste cost estimation
 */

export const getDaysUntilExpiry = (expiryDateString) => {
  if (!expiryDateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (expiryDateString) => {
  const days = getDaysUntilExpiry(expiryDateString);
  if (days < 0) return 'expired';
  if (days <= 3) return 'expiring';
  return 'fresh';
};

export const formatExpiryLabel = (expiryDateString) => {
  const days = getDaysUntilExpiry(expiryDateString);
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'Expired yesterday' : `Expired ${abs} days ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 3) return `Expires in ${days} days`;
  return `${days} days left`;
};

export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getQuickFutureDate = (daysToAdd) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

/**
 * Calculates estimated food waste cost using the item's actual price per unit (₹)
 * and wasted quantity.
 * 
 * If price is missing or unrecorded, returns null so the UI can display "Price not added"
 * without assuming any hardcoded or arbitrary defaults.
 * 
 * Formula: unit_price * quantity
 */
export const calculateItemWasteCost = (item) => {
  if (!item) return null;

  let unitPrice = null;

  // 1. Check direct price_per_unit attribute
  if (item.price_per_unit !== undefined && item.price_per_unit !== null && item.price_per_unit !== '') {
    const parsed = parseFloat(item.price_per_unit);
    if (!isNaN(parsed) && parsed >= 0) {
      unitPrice = parsed;
    }
  } else if (item.notes) {
    // 2. Check for [Price: XX] in notes (fallback if database migration hasn't been run yet)
    const match = item.notes.match(/\[Price:\s*([0-9.]+)\]/i);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed >= 0) {
        unitPrice = parsed;
      }
    }
  }

  // If no price was recorded, return null (do not assume any default value)
  if (unitPrice === null) {
    return null;
  }

  const rawQty = parseFloat(item.quantity);
  const validQty = !isNaN(rawQty) && rawQty > 0 ? rawQty : 1.0;
  const product = unitPrice * validQty;
  if (isNaN(product)) return null;

  return Number(product.toFixed(2));
};

/**
 * Helper to format waste cost display:
 * - If price is present: "₹XX.XX"
 * - If price is missing: "Price not added"
 */
export const formatItemWasteCost = (item) => {
  const cost = calculateItemWasteCost(item);
  if (typeof cost !== 'number' || isNaN(cost)) return 'Price not added';
  return `₹${cost.toFixed(2)}`;
};

/**
 * Extracts waste reason from item notes (format: "[Wasted: Reason] optional notes")
 */
export const extractWasteReason = (notes) => {
  if (!notes) return 'Unspecified';
  const match = notes.match(/\[Wasted:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : 'Unspecified';
};
