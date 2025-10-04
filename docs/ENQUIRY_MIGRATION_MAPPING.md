# Enquiry Migration Mapping: Old System → New System

## Database Locations
- **Old System**: `helix-database-server.database.windows.net/helix-core-data` → `dbo.enquiries`
- **New System**: `instructions.database.windows.net/instructions` → `dbo.enquiries`

## Field Mapping

### Core Identity & Timing
| Old System (helix-core-data) | New System (instructions) | Notes |
|------------------------------|---------------------------|-------|
| `ID` (nvarchar(50)) | `id` (int, IDENTITY) | New system uses auto-increment; old ID should be stored in `acid` |
| `Date_Created` (date) | N/A | Not migrated - use `datetime` instead |
| `Touchpoint_Date` (date) | `datetime` (datetime) | Primary timestamp field |

### Contact Information
| Old System | New System | Notes |
|------------|------------|-------|
| `First_Name` (nvarchar(MAX)) | `first` (nvarchar(100)) | **Truncate if > 100 chars** |
| `Last_Name` (nvarchar(MAX)) | `last` (nvarchar(100)) | **Truncate if > 100 chars** |
| `Email` (nvarchar(100)) | `email` (nvarchar(255)) | Expanded capacity |
| `Phone_Number` (nvarchar(100)) | `phone` (nvarchar(50)) | **Truncate if > 50 chars** |
| `Company` (nvarchar(100)) | N/A | Store in `notes` if important |

### Work Classification
| Old System | New System | Notes |
|------------|------------|-------|
| `Area_of_Work` (nvarchar(MAX)) | `aow` (nvarchar(100)) | **Truncate if > 100 chars** |
| `Type_of_Work` (nvarchar(MAX)) | `tow` (nvarchar(100)) | **Truncate if > 100 chars** |
| `Method_of_Contact` (nvarchar(50)) | `moc` (nvarchar(50)) | Direct mapping |

### Assignment & Pipeline
| Old System | New System | Notes |
|------------|------------|-------|
| `Point_of_Contact` (nvarchar(50)) | `poc` (nvarchar(100)) | **NEW FEATURE: Claim tracking** |
| N/A | `claim` (datetime) | **NEW: When enquiry was claimed** |
| N/A | `stage` (nvarchar(50)) | **NEW: Pipeline stage** (unclaimed/claimed/pitched/instructed) |
| N/A | `pitch` (int, FK to Deals) | **NEW: Link to pitch/deal** |
| `Matter_Ref` (nvarchar(100)) | N/A | Moved to Instructions/Matters tables |

### Source Tracking
| Old System | New System | Notes |
|------------|------------|-------|
| `Ultimate_Source` (nvarchar(100)) | `source` (nvarchar(100)) | Marketing source |
| `Referral_URL` (nvarchar(MAX)) | `url` (nvarchar(MAX)) | Landing page URL |
| `Contact_Referrer` (nvarchar(100)) | `contact_referrer` (nvarchar(100)) | Direct mapping |
| `Referring_Company` (nvarchar(100)) | `company_referrer` (nvarchar(100)) | Direct mapping |
| `GCLID` (nvarchar(MAX)) | `gclid` (nvarchar(255)) | Google Click ID |

### Financial & Qualification
| Old System | New System | Notes |
|------------|------------|-------|
| `Value` (nvarchar(100)) | `value` (nvarchar(100)) | Estimated case value |
| `Gift_Rank` (smallint) | `rank` (nvarchar(50)) | Convert number to string |
| `Rating` (nvarchar(50)) | `rating` (nvarchar(50)) | Quality rating |

### Operational
| Old System | New System | Notes |
|------------|------------|-------|
| `Call_Taker` (nvarchar(50)) | `rep` (nvarchar(100)) | Who took the call |
| `Initial_first_call_notes` (nvarchar(MAX)) | `notes` (nvarchar(MAX)) | Capture all notes here |
| N/A | `card_id` (nvarchar(100)) | **NEW: Teams card reference** |

### Legacy Identifier
| Old System | New System | Notes |
|------------|------------|-------|
| `ID` (original) | `acid` (nvarchar(100)) | **Store old system ID here** |

## Fields NOT Migrated (Address Fields)
These should remain in old system or be stored in a separate contacts table:
- `Title`, `DOB`, `Secondary_Phone`, `Tags`
- `Unit_Building_Name_or_Number`, `Mailing_Street`, `Mailing_Street_2`, `Mailing_Street_3`
- `Postal_Code`, `City`, `Mailing_County`, `Country`
- `Website`, `Campaign`, `Ad_Group`, `Search_Keyword`
- `Do_not_Market`, `IP_Address`, `TDMY`, `TDN`, `pocname`, `Other_Referrals`

## Migration Strategy

### 1. Pre-Migration Validation
```sql
-- Check for data that will be truncated
SELECT 
    ID,
    LEN(First_Name) as FirstNameLen,
    LEN(Last_Name) as LastNameLen,
    LEN(Area_of_Work) as AowLen,
    LEN(Type_of_Work) as TowLen
FROM [helix-core-data].dbo.enquiries
WHERE 
    LEN(First_Name) > 100 
    OR LEN(Last_Name) > 100 
    OR LEN(Area_of_Work) > 100 
    OR LEN(Type_of_Work) > 100
    OR LEN(Phone_Number) > 50
```

### 2. Migration INSERT Template
```sql
INSERT INTO [instructions].dbo.enquiries (
    datetime, first, last, email, phone,
    aow, tow, moc, poc, source, url,
    contact_referrer, company_referrer, gclid,
    value, rank, rating, rep, notes, acid,
    stage, claim, card_id, pitch
)
SELECT 
    CAST(Touchpoint_Date AS datetime),
    LEFT(ISNULL(First_Name, ''), 100),
    LEFT(ISNULL(Last_Name, ''), 100),
    ISNULL(Email, ''),
    LEFT(ISNULL(Phone_Number, ''), 50),
    LEFT(ISNULL(Area_of_Work, ''), 100),
    LEFT(ISNULL(Type_of_Work, ''), 100),
    ISNULL(Method_of_Contact, ''),
    LEFT(ISNULL(Point_of_Contact, ''), 100),
    ISNULL(Ultimate_Source, ''),
    ISNULL(Referral_URL, ''),
    ISNULL(Contact_Referrer, ''),
    ISNULL(Referring_Company, ''),
    LEFT(ISNULL(GCLID, ''), 255),
    ISNULL(Value, ''),
    CAST(ISNULL(Gift_Rank, '') AS nvarchar(50)),
    ISNULL(Rating, ''),
    ISNULL(Call_Taker, ''),
    ISNULL(Initial_first_call_notes, ''),
    ISNULL(ID, ''),
    -- New fields default to NULL until claimed/progressed
    NULL, -- stage (will be set when claimed)
    NULL, -- claim datetime
    NULL, -- card_id (will be set when Teams card created)
    NULL  -- pitch (will be set when deal created)
FROM [helix-core-data].dbo.enquiries
WHERE ID = ?  -- Migrate specific enquiry
```

### 3. User-Triggered Migration Flow (UI Feature)
**Feature Requirements:**
1. User views enquiry in old system report
2. Clicks "Migrate to New System" button
3. System checks if enquiry already exists (by `acid` field)
4. If exists, show link to existing record
5. If not, perform INSERT with validation
6. Return new `id` and allow immediate claim action

**API Endpoint Needed:**
```
POST /api/enquiries/migrate
Body: { oldSystemId: "27367" }
Response: { 
  success: true, 
  newId: 123, 
  acid: "27367",
  canClaim: true 
}
```

## Pipeline State Machine

### Stage Transitions
```
unclaimed → claimed → pitched → instructed → matter
```

### Field Changes Per Stage
| Stage | `stage` | `poc` | `claim` | `pitch` | `card_id` |
|-------|---------|-------|---------|---------|-----------|
| Unclaimed | NULL or 'unclaimed' | NULL or 'team@helix-law.com' | NULL | NULL | NULL |
| Claimed | 'claimed' | fee-earner@helix-law.com | GETDATE() | NULL | card-uuid |
| Pitched | 'pitched' | (same) | (same) | DealId | (same) |
| Instructed | 'instructed' | (same) | (same) | DealId → InstructionRef | (same) |

## Critical Constraints

1. **ACID field must be unique** if migrating from old system (add unique constraint)
2. **Claim timestamp** only set once, never updated
3. **POC email** must match team member in `dbo.team` table
4. **Card ID** references Teams Adaptive Card (for linking back to conversation)
5. **Pitch foreign key** must exist in `dbo.Deals` before setting

## Next Steps for Implementation

1. ✅ Document field mapping (this file)
2. ⬜ Add unique constraint on `acid` field
3. ⬜ Create migration API endpoint in `/api/src/`
4. ⬜ Add "Migrate" button to EnquiriesReport UI
5. ⬜ Implement claim workflow (sets `poc`, `claim`, `card_id`, `stage`)
6. ⬜ Add pipeline visualization showing all stages
7. ⬜ Test with Luke Test enquiry
