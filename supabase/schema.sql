-- =============================================================================
-- RetailFlow / SHOP-ERP Supabase Database Schema
-- Supports both:
-- 1. Rapid JSON-blob sync (`retailflow_data`) for offline-first Zustand client
-- 2. Fully normalized relational schema for multi-user ERP querying and reporting
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. FAST SYNC TABLE (Direct replacement for Firestore retailflow_data document)
-- =============================================================================
create table if not exists public.retailflow_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blob text not null,
  ts timestamptz default now(),
  version integer default 3,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.retailflow_data enable row level security;

-- Policies for public.retailflow_data
create policy "Users can view their own sync data"
  on public.retailflow_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sync data"
  on public.retailflow_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sync data"
  on public.retailflow_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sync data"
  on public.retailflow_data for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 2. NORMALIZED RELATIONAL ERP SCHEMA (For structured multi-user querying)
-- =============================================================================

-- Firms / Tenants
create table if not exists public.firms (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  firm_name text not null,
  gstin text,
  address text,
  state text,
  phone text,
  email text,
  website text,
  bank_name text,
  account_no text,
  ifsc text,
  upi_id text,
  gst_registered boolean default false,
  business_nature text default 'retail',
  billing_type text default 'retail',
  inv_prefix text default 'INV',
  default_gst_rate numeric(5,2) default 18,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.firms enable row level security;
create policy "Users can manage their own firms" on public.firms
  for all using (auth.uid() = owner_id);

-- Customers / Parties
create table if not exists public.customers (
  id text primary key,
  firm_id uuid references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  state text,
  gstin text,
  credit_limit numeric(12,2) default 0,
  outstanding numeric(12,2) default 0,
  created_at timestamptz default now()
);
alter table public.customers enable row level security;
create policy "Users can manage their own customers" on public.customers
  for all using (auth.uid() = user_id);

-- Inventory / Products
create table if not exists public.inventory (
  id text primary key,
  firm_id uuid references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  hsn text,
  unit text default 'pcs',
  price_mode text default 'excl',
  rate numeric(12,2) default 0,
  mrp numeric(12,2) default 0,
  stock numeric(12,2) default 0,
  gst_rate numeric(5,2) default 18,
  low_stock_alert numeric(12,2) default 5,
  barcode text,
  created_at timestamptz default now()
);
alter table public.inventory enable row level security;
create policy "Users can manage their own inventory" on public.inventory
  for all using (auth.uid() = user_id);

-- Invoices
create table if not exists public.invoices (
  id text primary key,
  firm_id uuid references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_no text not null,
  date date not null default current_date,
  due_date date,
  customer_name text not null,
  customer_phone text,
  customer_gstin text,
  customer_id text references public.customers(id) on delete set null,
  payment_method text default 'cash',
  status text default 'paid',
  fy text,
  is_igst boolean default false,
  total_taxable numeric(12,2) default 0,
  gst_amount numeric(12,2) default 0,
  extra_charges numeric(12,2) default 0,
  inv_discount numeric(12,2) default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz default now()
);
alter table public.invoices enable row level security;
create policy "Users can manage their own invoices" on public.invoices
  for all using (auth.uid() = user_id);

-- Invoice Line Items
create table if not exists public.invoice_items (
  id text primary key,
  invoice_id text not null references public.invoices(id) on delete cascade,
  product_id text references public.inventory(id) on delete set null,
  name text not null,
  qty numeric(12,2) not null default 1,
  rate numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 18,
  hsn text,
  unit text default 'pcs',
  discount numeric(12,2) default 0,
  taxable numeric(12,2) default 0,
  gst numeric(12,2) default 0,
  total numeric(12,2) not null default 0
);
alter table public.invoice_items enable row level security;
create policy "Users can manage their own invoice items" on public.invoice_items
  for all using (
    exists (select 1 from public.invoices where invoices.id = invoice_items.invoice_id and invoices.user_id = auth.uid())
  );

-- Indexes for optimal performance
create index if not exists idx_invoices_user_date on public.invoices(user_id, date desc);
create index if not exists idx_invoices_fy on public.invoices(user_id, fy);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index if not exists idx_inventory_user on public.inventory(user_id);
create index if not exists idx_customers_user on public.customers(user_id);
