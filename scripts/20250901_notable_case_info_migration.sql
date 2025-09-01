/* Migration: Extend notable_case_info for prospect context & exact value
   Date: 2025-09-01
   Safe to re-run (idempotent guards). */

/* 1. Add new columns if missing */
IF COL_LENGTH('dbo.notable_case_info','context_type') IS NULL
  ALTER TABLE dbo.notable_case_info ADD context_type CHAR(1) NOT NULL CONSTRAINT DF_notable_case_info_context_type DEFAULT('C');
GO
IF COL_LENGTH('dbo.notable_case_info','prospect_id') IS NULL
  ALTER TABLE dbo.notable_case_info ADD prospect_id VARCHAR(50) NULL;
GO
IF COL_LENGTH('dbo.notable_case_info','value_in_dispute_exact') IS NULL
  ALTER TABLE dbo.notable_case_info ADD value_in_dispute_exact DECIMAL(19,2) NULL;
GO
-- merit_press assumed present; uncomment if absent
-- IF COL_LENGTH('dbo.notable_case_info','merit_press') IS NULL ALTER TABLE dbo.notable_case_info ADD merit_press TEXT NULL; GO

/* 2. Drop existing check constraints if re-running */
IF OBJECT_ID('CK_notable_case_info_context','C') IS NOT NULL
  ALTER TABLE dbo.notable_case_info DROP CONSTRAINT CK_notable_case_info_context;
GO
IF OBJECT_ID('CK_notable_case_info_value_exact','C') IS NOT NULL
  ALTER TABLE dbo.notable_case_info DROP CONSTRAINT CK_notable_case_info_value_exact;
GO

/* 3. Add updated check constraints */
ALTER TABLE dbo.notable_case_info WITH CHECK ADD CONSTRAINT CK_notable_case_info_context
CHECK ((context_type='C' AND display_number IS NOT NULL AND prospect_id IS NULL)
    OR (context_type='P' AND prospect_id IS NOT NULL AND display_number IS NULL));
GO
ALTER TABLE dbo.notable_case_info WITH CHECK ADD CONSTRAINT CK_notable_case_info_value_exact
CHECK (value_in_dispute_exact IS NULL OR value_in_dispute_exact > 500000);
GO

/* 4. Backfill context_type for legacy rows */
UPDATE dbo.notable_case_info
SET context_type = 'C'
WHERE context_type IS NULL OR context_type NOT IN ('C','P');
GO

/* 5. Create filtered indexes if missing */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_notable_case_info_display_number' AND object_id=OBJECT_ID('dbo.notable_case_info'))
  CREATE INDEX IX_notable_case_info_display_number ON dbo.notable_case_info(display_number) WHERE display_number IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_notable_case_info_prospect_id' AND object_id=OBJECT_ID('dbo.notable_case_info'))
  CREATE INDEX IX_notable_case_info_prospect_id ON dbo.notable_case_info(prospect_id) WHERE prospect_id IS NOT NULL;
GO

/* 6. Verification queries */
SELECT TOP 5 * FROM dbo.notable_case_info ORDER BY created_at DESC;
EXEC sp_help 'dbo.notable_case_info';

/* Rollback (manual):
   ALTER TABLE dbo.notable_case_info DROP CONSTRAINT CK_notable_case_info_value_exact;
   ALTER TABLE dbo.notable_case_info DROP CONSTRAINT CK_notable_case_info_context;
   ALTER TABLE dbo.notable_case_info DROP COLUMN value_in_dispute_exact;
   ALTER TABLE dbo.notable_case_info DROP COLUMN prospect_id;
   ALTER TABLE dbo.notable_case_info DROP COLUMN context_type;
*/