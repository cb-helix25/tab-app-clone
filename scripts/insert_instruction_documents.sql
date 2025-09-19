/*
  Helper: Register uploaded Azure blobs as instruction documents.
  Usage: Update @InstructionRef and the VALUES rows to match your files.
  Fields expected by server/routes/documents.js:
    - DocumentId (IDENTITY) [do not supply]
    - InstructionRef (NVARCHAR)
    - FileName (NVARCHAR)
    - BlobUrl (NVARCHAR)  -- Full https URL to the blob
    - FileSizeBytes (BIGINT)
    - UploadedBy (NVARCHAR)
    - UploadedAt (DATETIME, use GETUTCDATE())
*/

SET NOCOUNT ON;

DECLARE @InstructionRef NVARCHAR(50) = N'HLX-26710-66409HLX-26710-66409'; -- change if needed
DECLARE @UploadedBy     NVARCHAR(255) = N'IL';              -- who uploaded/registered

/* Example inserts — replace with your actual blob URLs and sizes */
INSERT INTO dbo.Documents (InstructionRef, FileName, BlobUrl, FileSizeBytes, UploadedBy, UploadedAt)
VALUES
  (@InstructionRef, N'Passport.pdf',
   N'https://instructionfiles.blob.core.windows.net/instructions/HLX-26710-66409/Passport.pdf',
   524288, @UploadedBy, GETUTCDATE()),
  (@InstructionRef, N'UtilityBill.pdf',
   N'https://instructionfiles.blob.core.windows.net/instructions/HLX-26710-66409/UtilityBill.pdf',
   262144, @UploadedBy, GETUTCDATE());

/* Verify */
SELECT TOP (50)
  d.DocumentId,
  d.InstructionRef,
  d.FileName,
  d.BlobUrl,
  d.FileSizeBytes,
  d.UploadedBy,
  d.UploadedAt
FROM dbo.Documents d
WHERE d.InstructionRef = @InstructionRef
ORDER BY d.UploadedAt DESC;
