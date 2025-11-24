-- Create flights table with unique constraint
create table if not exists flights (
  id uuid default gen_random_uuid() primary key,
  flight_number text not null,
  departure_date timestamp with time zone not null,
  origin text not null,
  destination text not null,
  status flight_status_enum default 'Confirmado',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (flight_number, departure_date)
);

-- Add flight_id to tickets
alter table tickets add column if not exists flight_id uuid references flights(id);

-- Enable RLS on flights
alter table flights enable row level security;

-- Allow authenticated users to view flights (needed for dashboard join)
create policy "Authenticated users can view flights" on flights
  for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert flights (needed for fetchBookingDetails)
create policy "Authenticated users can insert flights" on flights
  for insert with check (auth.role() = 'authenticated');
