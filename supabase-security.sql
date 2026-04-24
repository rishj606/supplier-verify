-- SupplierCheck — Row Level Security
-- Run this in Supabase SQL Editor after setup/migration.

-- === reports ===
alter table reports enable row level security;

create policy "Server can insert reports"
  on reports for insert to anon with check (true);

create policy "Server can read reports"
  on reports for select to anon using (true);

-- Allows updating the context tag from the feedback endpoint
create policy "Server can update reports context"
  on reports for update to anon
  using (true)
  with check (true);

-- === feedback ===
alter table feedback enable row level security;

create policy "Server can insert feedback"
  on feedback for insert to anon with check (true);

create policy "Server can read feedback"
  on feedback for select to anon using (true);
