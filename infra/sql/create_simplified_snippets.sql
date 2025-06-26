-- SQL schema for pitch builder simplified blocks and snippet edits
-- Tables live in the same database as the Instructions app

CREATE TABLE dbo.SimplifiedBlocks
(
    BlockId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(400) NULL,
    Placeholder NVARCHAR(100) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL
);

CREATE TABLE dbo.SimplifiedBlockSnippets
(
    SnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlocks(BlockId),
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    IsApproved BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL,
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL
);

CREATE TABLE dbo.SnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, approved, rejected
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);

GO