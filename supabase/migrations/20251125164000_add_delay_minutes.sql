-- Add delay_minutes column to flights table
alter table flights 
add column if not exists delay_minutes integer default 0;
