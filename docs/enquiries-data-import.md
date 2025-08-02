# Data Import Best Practices for [dbo].[enquiries]

## Overview
When inserting data into the `[dbo].[enquiries]` table, especially from external sources (e.g., JSON, CSV, or manual scripts), it is important to ensure that all string values are properly escaped and formatted to avoid SQL errors and data corruption.

## Key Points
- **Escaping Special Characters:**
  - Single quotes (`'`) in string values must be escaped by doubling them (`''`).
  - Newlines and other control characters should be handled or removed as needed.
- **Preferred Methods for Data Import:**
  1. **Parameterized Queries:**
     - Use application code (C#, Python, Node.js, etc.) with parameterized queries. This automatically handles escaping and prevents SQL injection.
  2. **SQL Server Import Tools:**
     - Use `OPENJSON`, `BULK INSERT`, or SQL Server Integration Services (SSIS) for bulk data import. These tools are designed to handle large datasets and proper data formatting.
  3. **Manual SQL Scripts:**
     - If you must use manual SQL scripts, ensure all string values are escaped and formatted correctly.
- **Staging Table (Optional):**
  - For complex or repeated imports, consider importing raw data into a staging table, then transforming and inserting into `[enquiries]` with T-SQL.

## Example: Escaping Single Quotes

Original value:
```
O'Reilly's Law Firm
```
Escaped for SQL:
```
O''Reilly''s Law Firm
```

## Example: Parameterized Query (C#)
```csharp
using (var cmd = new SqlCommand("INSERT INTO [enquiries] (notes) VALUES (@notes)", conn))
{
    cmd.Parameters.AddWithValue("@notes", notesValue);
    cmd.ExecuteNonQuery();
}
```

## Example: Using OPENJSON
```sql
DECLARE @json NVARCHAR(MAX) = N'[{"notes": "O''Reilly''s Law Firm"}]';
INSERT INTO [enquiries] (notes)
SELECT [notes]
FROM OPENJSON(@json)
WITH ([notes] NVARCHAR(MAX) '$.notes');
```

## Summary
- Always escape single quotes in manual SQL scripts.
- Prefer parameterized queries or import tools for safety and convenience.
- Document and automate your import process for repeatability and reliability.
