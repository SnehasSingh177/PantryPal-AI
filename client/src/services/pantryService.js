import { supabase } from './supabaseClient';

/**
 * Service to handle all Supabase CRUD operations for the pantry_items table.
 * All queries automatically adhere to PostgreSQL Row Level Security (RLS).
 */

export const pantryService = {
  /**
   * Fetch all pantry items for the authenticated user
   */
  async getItems(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch pantry items.');
    }

    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('[pantryService.getItems] Error:', error);
      throw error;
    }

    // Ensure price_per_unit is extracted if present in column or in notes fallback
    return (data || []).map((item) => {
      if (!item) return item;
      if ((item.price_per_unit === undefined || item.price_per_unit === null) && item.notes) {
        const match = item.notes.match(/\[Price:\s*([0-9.]+)\]/i);
        if (match) {
          const parsed = parseFloat(match[1]);
          if (!isNaN(parsed)) {
            return { ...item, price_per_unit: parsed };
          }
        }
      }
      return item;
    });
  },

  /**
   * Add a new item to the user's pantry
   */
  async addItem(itemData, userId) {
    if (!userId) {
      throw new Error('User ID is required to create a pantry item.');
    }

    const priceVal = (itemData.price_per_unit !== undefined && itemData.price_per_unit !== '' && itemData.price_per_unit !== null && !isNaN(parseFloat(itemData.price_per_unit)))
      ? parseFloat(itemData.price_per_unit)
      : null;

    let notesText = itemData.notes ? itemData.notes.trim() : null;
    if (priceVal !== null) {
      // Also embed in notes as a resilient fallback in case migration hasn't been applied in Supabase yet
      if (!notesText) {
        notesText = `[Price: ${priceVal.toFixed(2)}]`;
      } else if (!notesText.includes('[Price:')) {
        notesText = `[Price: ${priceVal.toFixed(2)}] ${notesText}`;
      }
    }

    // Input sanitization and formatting to match schema
    const payload = {
      user_id: userId,
      name: itemData.name.trim(),
      category: itemData.category || 'Other',
      quantity: parseFloat(itemData.quantity) || 1.0,
      unit: (itemData.unit || 'pcs').trim(),
      price_per_unit: priceVal,
      purchase_date: itemData.purchase_date || new Date().toISOString().split('T')[0],
      expiry_date: itemData.expiry_date,
      storage_location: itemData.storage_location || 'Pantry',
      status: itemData.status || 'active',
      notes: notesText,
      is_low_stock: Boolean(itemData.is_low_stock),
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('pantry_items')
      .insert([payload])
      .select()
      .single();

    // Fallback if price_per_unit column is not yet migrated in Supabase table
    if (error && (error.code === '42703' || error.message?.includes('price_per_unit'))) {
      console.warn('[pantryService] price_per_unit column not found in Supabase. Inserting with price preserved in notes. Run migration in supabase/migrations/20260928_add_price_per_unit.sql to enable native column.');
      const fallbackPayload = { ...payload };
      delete fallbackPayload.price_per_unit;
      const retry = await supabase
        .from('pantry_items')
        .insert([fallbackPayload])
        .select()
        .single();
      if (retry.error) {
        console.error('[pantryService.addItem] Fallback error:', retry.error);
        throw retry.error;
      }
      data = { ...retry.data, price_per_unit: priceVal };
    } else if (error) {
      console.error('[pantryService.addItem] Error:', error);
      throw error;
    }

    return { ...data, price_per_unit: (data?.price_per_unit !== undefined && data?.price_per_unit !== null) ? data.price_per_unit : priceVal };
  },

  /**
   * Update an existing pantry item
   */
  async updateItem(itemId, itemData, userId) {
    if (!itemId || !userId) {
      throw new Error('Item ID and User ID are required to update.');
    }

    const priceVal = (itemData.price_per_unit !== undefined && itemData.price_per_unit !== '' && itemData.price_per_unit !== null && !isNaN(parseFloat(itemData.price_per_unit)))
      ? parseFloat(itemData.price_per_unit)
      : null;

    let notesText = itemData.notes ? itemData.notes.trim() : null;
    if (priceVal !== null) {
      if (!notesText) {
        notesText = `[Price: ${priceVal.toFixed(2)}]`;
      } else if (!notesText.includes('[Price:')) {
        notesText = `[Price: ${priceVal.toFixed(2)}] ${notesText}`;
      } else {
        notesText = notesText.replace(/\[Price:\s*[0-9.]+\]/i, `[Price: ${priceVal.toFixed(2)}]`);
      }
    } else if (notesText && notesText.includes('[Price:')) {
      notesText = notesText.replace(/\[Price:\s*[0-9.]+\]\s*/i, '').trim() || null;
    }

    const payload = {
      name: itemData.name.trim(),
      category: itemData.category,
      quantity: parseFloat(itemData.quantity) || 1.0,
      unit: (itemData.unit || 'pcs').trim(),
      price_per_unit: priceVal,
      purchase_date: itemData.purchase_date,
      expiry_date: itemData.expiry_date,
      storage_location: itemData.storage_location,
      status: itemData.status || 'active',
      notes: notesText,
      is_low_stock: Boolean(itemData.is_low_stock),
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('pantry_items')
      .update(payload)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    // Fallback if price_per_unit column is not yet migrated in Supabase table
    if (error && (error.code === '42703' || error.message?.includes('price_per_unit'))) {
      console.warn('[pantryService] price_per_unit column not found in Supabase. Updating with price preserved in notes. Run migration in supabase/migrations/20260928_add_price_per_unit.sql.');
      const fallbackPayload = { ...payload };
      delete fallbackPayload.price_per_unit;
      const retry = await supabase
        .from('pantry_items')
        .update(fallbackPayload)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();
      if (retry.error) {
        console.error('[pantryService.updateItem] Fallback error:', retry.error);
        throw retry.error;
      }
      data = { ...retry.data, price_per_unit: priceVal };
    } else if (error) {
      console.error('[pantryService.updateItem] Error:', error);
      throw error;
    }

    return { ...data, price_per_unit: (data?.price_per_unit !== undefined && data?.price_per_unit !== null) ? data.price_per_unit : priceVal };
  },

  /**
   * Delete a pantry item
   */
  async deleteItem(itemId, userId) {
    if (!itemId || !userId) {
      throw new Error('Item ID and User ID are required to delete.');
    }

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      console.error('[pantryService.deleteItem] Error:', error);
      throw error;
    }

    return true;
  },

  /**
   * Quick status change (e.g. mark as consumed or wasted with optional reason in notes)
   */
  async updateStatus(itemId, status, userId, notes = undefined) {
    if (!itemId || !userId) {
      throw new Error('Item ID and User ID are required.');
    }

    const payload = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      payload.notes = notes;
    }

    // Use .select() without .single() to avoid PGRST116 row count exceptions
    const { data, error } = await supabase
      .from('pantry_items')
      .update(payload)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('[pantryService.updateStatus] Supabase Error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    // In case the query updated the row but select returned empty
    return {
      id: itemId,
      user_id: userId,
      status,
      ...(notes !== undefined ? { notes } : {}),
      updated_at: payload.updated_at
    };
  }
};
