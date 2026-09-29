-- ==============================================================================
-- PantryPal AI – Database Migration: Add price_per_unit to pantry_items
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Add price_per_unit column (in Indian Rupees ₹) to pantry_items table
ALTER TABLE public.pantry_items
ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10, 2) CHECK (price_per_unit IS NULL OR price_per_unit >= 0);

-- 2. Add documentation comment
COMMENT ON COLUMN public.pantry_items.price_per_unit IS 'Price per unit in Indian Rupees (₹), optional';
