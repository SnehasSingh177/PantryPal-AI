import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { pantryService } from '../services/pantryService';
import { getExpiryStatus, calculateItemWasteCost } from '../utils/dateUtils';

export const PantryContext = createContext(null);

export const PantryProvider = ({ children }) => {
  const { user, isConfigured } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Fetch all items from Supabase for current user
  const fetchItems = useCallback(async () => {
    if (!user?.id || !isConfigured) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await pantryService.getItems(user.id);
      setItems(data);
    } catch (err) {
      console.error('[PantryContext] Failed to load pantry items:', err);
      const msg = err.message || 'Failed to fetch pantry inventory.';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isConfigured, showNotification]);

  // Load items whenever user logs in or changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add Item
  const addItem = async (itemData) => {
    if (!user?.id) throw new Error('Please sign in to add pantry items.');
    try {
      const newItem = await pantryService.addItem(itemData, user.id);
      setItems((prev) => [...prev, newItem].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)));
      showNotification(`"${newItem.name}" added to your pantry!`, 'success');
      return newItem;
    } catch (err) {
      const msg = err.message || 'Error saving item to your pantry.';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // Update Item
  const updateItem = async (itemId, itemData) => {
    if (!user?.id) throw new Error('Please sign in to update pantry items.');
    try {
      const updated = await pantryService.updateItem(itemId, itemData, user.id);
      setItems((prev) =>
        prev
          .map((item) => (item.id === itemId ? updated : item))
          .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      );
      showNotification(`"${updated.name}" updated successfully!`, 'success');
      return updated;
    } catch (err) {
      const msg = err.message || 'Error updating pantry item.';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // Delete Item
  const deleteItem = async (itemId) => {
    if (!user?.id) throw new Error('Please sign in to delete pantry items.');
    const itemToDelete = items.find((i) => i.id === itemId);
    try {
      await pantryService.deleteItem(itemId, user.id);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      showNotification(`"${itemToDelete?.name || 'Item'}" removed from pantry.`, 'success');
      return true;
    } catch (err) {
      const msg = err.message || 'Error deleting pantry item.';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // Mark Status (consumed / wasted / active) with optional reason
  const setItemStatus = async (itemId, newStatus, reason = null) => {
    if (!user?.id) throw new Error('Please sign in.');

    const currentItem = items.find((i) => i?.id === itemId);
    if (!currentItem) {
      throw new Error('Item not found in current inventory.');
    }

    try {
      let notesToSave = undefined;
      if (reason) {
        const existingNotes = currentItem.notes ? currentItem.notes.replace(/^\[Wasted:.*?\]\s*/, '') : '';
        notesToSave = existingNotes ? `[Wasted: ${reason}] ${existingNotes}` : `[Wasted: ${reason}]`;
      }

      const updated = await pantryService.updateStatus(itemId, newStatus, user.id, notesToSave);

      // Safe updated item object guaranteed to have all required properties
      const safeUpdated = (updated && updated.id) ? {
        ...currentItem,
        ...updated,
        price_per_unit: (updated.price_per_unit !== undefined && updated.price_per_unit !== null) ? updated.price_per_unit : currentItem.price_per_unit,
      } : {
        ...currentItem,
        status: newStatus,
        notes: notesToSave !== undefined ? notesToSave : currentItem.notes,
        updated_at: new Date().toISOString(),
      };

      setItems((prev) =>
        prev
          .map((item) => (item?.id === itemId ? safeUpdated : item))
          .filter(Boolean)
      );

      showNotification(`"${currentItem.name}" marked as ${newStatus}.`, 'success');
      return safeUpdated;
    } catch (err) {
      const msg = err.message || 'Error updating status.';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // Computed live statistics
  const stats = useMemo(() => {
    const validItems = (items || []).filter(Boolean);
    const activeItems = validItems.filter((i) => i.status === 'active');
    const consumedItems = validItems.filter((i) => i.status === 'consumed');
    const wastedItems = validItems.filter((i) => i.status === 'wasted');

    let freshCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let lowStockCount = 0;

    activeItems.forEach((item) => {
      if (!item?.expiry_date) return;
      const status = getExpiryStatus(item.expiry_date);
      if (status === 'fresh') freshCount++;
      else if (status === 'expiring') expiringCount++;
      else if (status === 'expired') expiredCount++;

      if (item.is_low_stock) lowStockCount++;
    });

    // Calculate real financial metrics using actual item prices
    let totalWasteCost = 0;
    let itemsWithWasteCost = 0;
    wastedItems.forEach((item) => {
      const cost = calculateItemWasteCost(item);
      if (typeof cost === 'number' && !isNaN(cost)) {
        totalWasteCost += cost;
        itemsWithWasteCost += 1;
      }
    });

    let totalSavingsCost = 0;
    let itemsWithSavingsCost = 0;
    consumedItems.forEach((item) => {
      const cost = calculateItemWasteCost(item);
      if (typeof cost === 'number' && !isNaN(cost)) {
        totalSavingsCost += cost;
        itemsWithSavingsCost += 1;
      }
    });

    const totalResolved = consumedItems.length + wastedItems.length;
    const wastePreventedRate = totalResolved > 0
      ? Math.round((consumedItems.length / totalResolved) * 100)
      : activeItems.length > 0 ? 92 : 0;

    return {
      total: activeItems.length,
      totalPantry: validItems.length,
      fresh: freshCount,
      expiringSoon: expiringCount,
      expired: expiredCount,
      lowStock: lowStockCount,
      consumed: consumedItems.length,
      wasted: wastedItems.length,
      wastePreventedRate,
      estimatedWasteCost: Number((totalWasteCost || 0).toFixed(2)),
      estimatedSavingsCost: Number((totalSavingsCost || 0).toFixed(2)),
      itemsWithWasteCost,
      itemsWithSavingsCost,
    };
  }, [items]);

  return (
    <PantryContext.Provider
      value={{
        items,
        loading,
        error,
        notification,
        stats,
        fetchItems,
        addItem,
        updateItem,
        deleteItem,
        setItemStatus,
        dismissNotification,
        showNotification,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
};

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};
