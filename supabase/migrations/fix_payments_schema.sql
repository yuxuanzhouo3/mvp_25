-- Migration to fix payments table schema
-- This migration adds the missing columns and migrates existing data

-- 1. Add new columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Migrate data from provider to method
UPDATE payments SET method = provider WHERE method IS NULL;

-- 3. Migrate data from metadata to type
UPDATE payments SET type = metadata->>'paymentType' WHERE type IS NULL AND metadata IS NOT NULL;

-- 4. Set default type for records without metadata
UPDATE payments SET type = 'pro' WHERE type IS NULL;

-- 5. Update status from 'completed' to 'paid'
UPDATE payments SET status = 'paid' WHERE status = 'completed';

-- 6. Set completed_at for paid records
UPDATE payments SET completed_at = created_at WHERE status = 'paid' AND completed_at IS NULL;

-- 7. Set updated_at for all records
UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;

-- 8. Drop the old provider column (optional - uncomment if you want to remove it)
-- ALTER TABLE payments DROP COLUMN IF EXISTS provider;

-- 9. Drop the metadata column (optional - uncomment if you want to remove it)
-- ALTER TABLE payments DROP COLUMN IF EXISTS metadata;
