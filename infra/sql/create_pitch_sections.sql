-- SQL schema for storing pitch builder sections per enquiry
CREATE TABLE pitchbuilder.PitchSections (
    SectionId INT IDENTITY(1,1) PRIMARY KEY,
    EnquiryId INT NOT NULL,
    Block NVARCHAR(100) NOT NULL,
    OptionLabel NVARCHAR(100) NULL,
    Content NVARCHAR(MAX) NULL,
    CreatedBy NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL
);

CREATE INDEX IX_PitchSections_EnquiryId ON pitchbuilder.PitchSections(EnquiryId);