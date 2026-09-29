-- ==============================================================================
-- PantryPal AI – Database Schema & Row Level Security (RLS)
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUM TYPES
create type item_category as enum (
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
);

create type storage_location as enum (
  'Fridge',
  'Freezer',
  'Pantry',
  'Countertop'
);

create type item_status as enum (
  'active',
  'consumed',
  'wasted'
);

-- 3. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. NOTIFICATION PREFERENCES TABLE
create table public.notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  email_notifications_enabled boolean default true not null,
  expiry_reminder_days integer default 3 not null check (expiry_reminder_days between 1 and 7),
  low_stock_alerts_enabled boolean default true not null,
  notification_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PANTRY ITEMS TABLE
create table public.pantry_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category item_category default 'Other' not null,
  quantity numeric(10, 2) default 1.0 not null check (quantity >= 0),
  unit text default 'pcs' not null,
  price_per_unit numeric(10, 2) check (price_per_unit is null or price_per_unit >= 0),
  purchase_date date default current_date not null,
  expiry_date date not null,
  storage_location storage_location default 'Pantry' not null,
  status item_status default 'active' not null,
  notes text,
  is_low_stock boolean default false not null,
  last_reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SAVED RECIPES TABLE
create table public.saved_recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  prep_time text,
  cook_time text,
  servings integer default 2,
  difficulty text default 'Easy',
  ingredients jsonb default '[]'::jsonb not null,
  instructions jsonb default '[]'::jsonb not null,
  pantry_items_used text[] default array[]::text[],
  chef_tip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PERFORMANCE INDEXES
create index idx_pantry_items_user_status on public.pantry_items(user_id, status);
create index idx_pantry_items_expiry on public.pantry_items(expiry_date);
create index idx_saved_recipes_user on public.saved_recipes(user_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.pantry_items enable row level security;
alter table public.saved_recipes enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Notification Preferences Policies
create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

-- Pantry Items Policies
create policy "Users can view own pantry items"
  on public.pantry_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own pantry items"
  on public.pantry_items for insert
  with check (auth.uid() = user_id);

-- Explicit WITH CHECK ensures users cannot reassign items to other users
create policy "Users can update own pantry items"
  on public.pantry_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own pantry items"
  on public.pantry_items for delete
  using (auth.uid() = user_id);

-- Saved Recipes Policies
create policy "Users can view own saved recipes"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved recipes"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved recipes"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);

-- 9. USER SIGNUP AUTOMATION TRIGGER
-- Automatically creates a profile and default notification settings when a new user registers via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), null);

  insert into public.notification_preferences (user_id, email_notifications_enabled, expiry_reminder_days, low_stock_alerts_enabled)
  values (new.id, true, 3, true);

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists to allow safe re-runs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. REMINDER LOGS TABLE (AUDIT TRAIL & DUPLICATE PREVENTION)
create table if not exists public.reminder_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  item_id uuid references public.pantry_items on delete cascade not null,
  notification_email text not null,
  reminder_date date default current_date not null,
  days_before_expiry integer not null,
  resend_message_id text,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_item_reminder_date unique (item_id, reminder_date)
);

create index if not exists idx_reminder_logs_item_date on public.reminder_logs(item_id, reminder_date);
create index if not exists idx_reminder_logs_user on public.reminder_logs(user_id);
create index if not exists idx_reminder_logs_sent_at on public.reminder_logs(sent_at);

alter table public.reminder_logs enable row level security;

create policy "Users can view own reminder logs"
  on public.reminder_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminder logs"
  on public.reminder_logs for insert
  with check (auth.uid() = user_id);

-- 11. AUTOMATED EXPIRY REMINDER HELPER PROCEDURES
create or replace function public.get_expiring_items_for_reminder_job()
returns table (
  user_id uuid,
  notification_email text,
  full_name text,
  expiry_reminder_days integer,
  item_id uuid,
  item_name text,
  item_quantity numeric,
  item_unit text,
  item_category item_category,
  item_storage_location storage_location,
  item_expiry_date date,
  days_until_expiry integer
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.user_id,
    coalesce(
      nullif(trim(p.notification_email), ''),
      u.email
    ) as notification_email,
    coalesce(prof.full_name, split_part(u.email, '@', 1)) as full_name,
    p.expiry_reminder_days,
    i.id as item_id,
    i.name as item_name,
    i.quantity as item_quantity,
    i.unit as item_unit,
    i.category as item_category,
    i.storage_location as item_storage_location,
    i.expiry_date as item_expiry_date,
    (i.expiry_date - current_date)::integer as days_until_expiry
  from public.pantry_items i
  join public.notification_preferences p on p.user_id = i.user_id
  join auth.users u on u.id = i.user_id
  left join public.profiles prof on prof.id = i.user_id
  left join public.reminder_logs rl on rl.item_id = i.id and rl.reminder_date = current_date
  where
    i.status = 'active'
    and p.email_notifications_enabled = true
    and (i.expiry_date - current_date) <= p.expiry_reminder_days
    and (i.expiry_date - current_date) >= -1
    and rl.id is null
  order by p.user_id, i.expiry_date asc;
end;
$$;

grant execute on function public.get_expiring_items_for_reminder_job() to anon, authenticated, service_role;

create or replace function public.log_sent_reminder(
  p_user_id uuid,
  p_item_id uuid,
  p_notification_email text,
  p_days_before_expiry integer,
  p_resend_message_id text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.reminder_logs (
    user_id,
    item_id,
    notification_email,
    reminder_date,
    days_before_expiry,
    resend_message_id,
    sent_at
  )
  values (
    p_user_id,
    p_item_id,
    p_notification_email,
    current_date,
    p_days_before_expiry,
    p_resend_message_id,
    now()
  )
  on conflict (item_id, reminder_date) do nothing
  returning id into v_id;

  update public.pantry_items
  set last_reminder_sent_at = now()
  where id = p_item_id;

  return v_id;
end;
$$;

grant execute on function public.log_sent_reminder(uuid, uuid, text, integer, text) to anon, authenticated, service_role;

