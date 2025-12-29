-- Migration to add gol_session column to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS gol_session JSONB;
