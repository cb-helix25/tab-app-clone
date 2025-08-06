# Pitch Builder Content Storage

Pitch builder responses are stored in the `pitchbuilder.PitchSections` table. Each row represents one of the five sections of a pitch email.

## Table structure

| Column       | Type            | Notes                                        |
|--------------|-----------------|----------------------------------------------|
| `SectionId`  | `INT IDENTITY`  | Primary key                                  |
| `EnquiryId`  | `INT`           | Related enquiry identifier                   |
| `Block`      | `NVARCHAR(100)` | Template block title                         |
| `OptionLabel`| `NVARCHAR(100)` | Option selected within the block             |
| `Content`    | `NVARCHAR(MAX)` | Final text inserted for the block            |
| `CreatedBy`  | `NVARCHAR(50)`  | Initials of the user saving the section      |
| `CreatedAt`  | `DATETIME2`     | Defaults to `SYSUTCDATETIME()`               |
| `UpdatedBy`  | `NVARCHAR(50)`  | Optional last editor                         |
| `UpdatedAt`  | `DATETIME2`     | Optional last edit timestamp                 |

## API

- `POST /api/pitches`
  - Persists an array of sections for an enquiry.
  - Body: `{ enquiryId: number, sections: [{ block, option, content }], user: string }`
- `GET /api/enquiry-emails/:enquiryId`
  - Returns saved sections (legacy route name).

Both routes proxy Azure Functions living inside a private network using the `recordPitchSections` and `fetchEnquiryEmails` functions respectively.
