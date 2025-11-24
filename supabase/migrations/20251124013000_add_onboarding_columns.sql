-- Add onboarding columns to agencies table
alter table agencies 
add column if not exists full_name text,
add column if not exists cnpj text,
add column if not exists whatsapp text;
