-- Reset schema for clean slate (Development only)
drop table if exists tickets;
drop table if exists agencies;
drop type if exists airline_enum;
drop type if exists flight_status_enum;
drop type if exists checkin_status_enum;

-- Create ENUMs
create type airline_enum as enum ('LATAM', 'GOL', 'AZUL');
create type flight_status_enum as enum ('Confirmado', 'Cancelado', 'Voado');
create type checkin_status_enum as enum ('Aberto', 'Fechado');

-- Create agencies table
create table agencies (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  subscription_plan text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for agencies
alter table agencies enable row level security;

create policy "Agencies can view their own profile." on agencies
  for select using (auth.uid() = id);

create policy "Agencies can update their own profile." on agencies
  for update using (auth.uid() = id);

-- Create tickets table
create table tickets (
  id uuid default gen_random_uuid() primary key,
  agency_id uuid references agencies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pnr text not null,
  passenger_lastname text not null,
  passenger_name text not null default 'Passageiro (Editar)',
  airline airline_enum not null,
  flight_number text not null, -- Extracted via scrape
  flight_date timestamp with time zone not null,
  origin text not null,
  destination text not null,
  status flight_status_enum default 'Confirmado',
  checkin_status checkin_status_enum default 'Fechado',
  pnr_file_url text
);

-- RLS for tickets
alter table tickets enable row level security;

create policy "Agencies can view their own tickets." on tickets
  for select using (auth.uid() = agency_id);

create policy "Agencies can insert their own tickets." on tickets
  for insert with check (auth.uid() = agency_id);

create policy "Agencies can update their own tickets." on tickets
  for update using (auth.uid() = agency_id);

create policy "Agencies can delete their own tickets." on tickets
  for delete using (auth.uid() = agency_id);

-- Function to handle new user signup (Auto-create agency profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.agencies (id, name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
