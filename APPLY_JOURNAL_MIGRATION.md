# Apply Journal Migration Guide

## Quick Start

### Option 1: Reset Database (Recommended for Development)
```bash
# This will apply all migrations including the new journal compatibility migration
supabase db reset
```

### Option 2: Apply Single Migration
```bash
# Apply just the journal compatibility migration
supabase migration up --db-url "your-database-url"
```

### Option 3: Manual SQL Execution
1. Open Supabase Studio
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20260214100000_journal_frontend_compatibility.sql`
4. Execute the SQL

## Verification Steps

### 1. Check Database Schema
```sql
-- Check journal table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'journal'
ORDER BY ordinal_position;

-- Check journal_images table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'journal_images'
ORDER BY ordinal_position;
```

### 2. Check Triggers
```sql
-- List all triggers on journal table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'journal';

-- List all triggers on journal_images table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'journal_images';
```

### 3. Test Data Sync
```sql
-- Test notes/content sync
UPDATE journal 
SET notes = 'Test sync from notes'
WHERE id = (SELECT id FROM journal LIMIT 1);

-- Verify content was updated
SELECT id, notes, content 
FROM journal 
WHERE notes = 'Test sync from notes';
```

## Run Automated Tests

```bash
# Test journal functionality
node scripts/test-journal-functionality.js
```

## Frontend Testing

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the Journal page

3. Test the following:
   - [ ] Page loads without errors
   - [ ] Can create new journal entry
   - [ ] Notes tab works (can save and load notes)
   - [ ] Trades tab shows trades for the selected date
   - [ ] Clicking on a trade navigates to trade detail page
   - [ ] Images tab allows uploading images
   - [ ] Can link images to trades
   - [ ] Calendar shows days with journal entries

## Troubleshooting

### Migration Fails
If the migration fails, check:
1. Are you connected to the correct database?
2. Do you have the necessary permissions?
3. Are there any conflicting column names?

### Columns Already Exist
If you see "column already exists" errors:
- This is normal if the migration was partially applied
- The migration uses `IF NOT EXISTS` so it's safe to re-run

### Triggers Not Working
Check if triggers were created:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%journal%';
```

If missing, manually create them from the migration file.

### Frontend Errors
If you see errors in the frontend:
1. Clear browser cache and local storage
2. Check browser console for specific errors
3. Verify database connection in `.env.local`
4. Check that all hooks are using correct field names

## Rollback (If Needed)

To rollback the migration:

```sql
-- Remove added columns
ALTER TABLE journal 
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS net_pl,
DROP COLUMN IF EXISTS num_trades,
DROP COLUMN IF EXISTS win_rate,
DROP COLUMN IF EXISTS profit_factor,
DROP COLUMN IF EXISTS total_profitable_pl,
DROP COLUMN IF EXISTS total_losing_pl,
DROP COLUMN IF EXISTS winning_trades,
DROP COLUMN IF EXISTS losing_trades,
DROP COLUMN IF EXISTS total_fees,
DROP COLUMN IF EXISTS all_trades_notes,
DROP COLUMN IF EXISTS all_journal_images_notes,
DROP COLUMN IF EXISTS image_captions,
DROP COLUMN IF EXISTS trades_executed;

ALTER TABLE journal_images
DROP COLUMN IF EXISTS journal_date;

-- Remove triggers
DROP TRIGGER IF EXISTS sync_journal_notes_content_trigger ON journal;
DROP TRIGGER IF EXISTS set_journal_image_date_trigger ON journal_images;

-- Remove functions
DROP FUNCTION IF EXISTS sync_journal_notes_content();
DROP FUNCTION IF EXISTS set_journal_image_date();

-- Remove view
DROP VIEW IF EXISTS journal_with_legacy_fields;
```

## Post-Migration Checklist

- [ ] Migration applied successfully
- [ ] All required columns present in journal table
- [ ] All required columns present in journal_images table
- [ ] Triggers created and working
- [ ] Frontend loads without errors
- [ ] Can create and edit journal entries
- [ ] Trades tab works correctly
- [ ] Images tab works correctly
- [ ] Notes tab works correctly

## Support

If you encounter issues:
1. Check the error message in browser console
2. Check Supabase logs in Supabase Studio
3. Verify database schema matches expected structure
4. Review `JOURNAL_PAGE_FIX_COMPLETE.md` for detailed information
