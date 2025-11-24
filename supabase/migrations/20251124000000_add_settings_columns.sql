-- Add settings columns to agencies table
alter table agencies 
add column if not exists logo_url text,
add column if not exists notify_email boolean default true;

-- Remove whatsapp columns if they exist (cleanup)
alter table agencies 
drop column if exists whatsapp_number,
drop column if exists notify_whatsapp;
