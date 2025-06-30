-- SQL schema for pitch builder default blocks and snippet edits
-- Tables live in the same database as the Instructions app

CREATE TABLE dbo.DefaultBlocks
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

-- Lookup table for snippet edit statuses
CREATE TABLE dbo.EditStatuses
(
    Status NVARCHAR(20) PRIMARY KEY
);

INSERT INTO dbo.EditStatuses
    (Status)
VALUES
    ('pending'),
    ('approved'),
    ('rejected');


CREATE TABLE dbo.DefaultBlockSnippets
(
    SnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    Version INT NOT NULL DEFAULT 1,
    IsApproved BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL,
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL
);

CREATE INDEX IX_DefaultBlockSnippets_BlockId ON dbo.DefaultBlockSnippets(BlockId);

CREATE TABLE dbo.DefaultBlockSnippetVersions
(
    VersionId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlockSnippets(SnippetId),
    VersionNumber INT NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.DefaultSnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,

    ProposedLabel NVARCHAR
(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks
(BlockId),
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    Status NVARCHAR
(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES dbo.EditStatuses
(Status),
    ReviewNotes NVARCHAR
(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);

CREATE INDEX IX_DefaultSnippetEdits_SnippetId ON dbo.DefaultSnippetEdits(SnippetId);

CREATE TABLE dbo.PlaceholderSnippets
(
    PlaceholderSnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    Placeholder NVARCHAR(100) NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    Version INT NOT NULL DEFAULT 1,
    IsApproved BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL,
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL
);

CREATE INDEX IX_PlaceholderSnippets_BlockId ON dbo.PlaceholderSnippets(BlockId);

CREATE TABLE dbo.PlaceholderSnippetVersions
(
    VersionId INT IDENTITY(1,1) PRIMARY KEY,
    PlaceholderSnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.PlaceholderSnippets(PlaceholderSnippetId),
    VersionNumber INT NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    Placeholder NVARCHAR(100) NOT NULL,
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.PlaceholderSnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    PlaceholderSnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.PlaceholderSnippets(PlaceholderSnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,
    ProposedLabel NVARCHAR(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    ProposedPlaceholder NVARCHAR(100) NULL,
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES dbo.EditStatuses(Status),
    ReviewNotes NVARCHAR(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);

CREATE INDEX IX_PlaceholderSnippetEdits_PlaceholderSnippetId ON dbo.PlaceholderSnippetEdits(PlaceholderSnippetId);

GO

-- ---------------------------------------------------------------
-- Sample data to support local development and testing
-- ---------------------------------------------------------------

INSERT INTO dbo.DefaultBlocks
    (Title, Description, Placeholder, CreatedBy)
VALUES
    ('Opening', 'Introductory lines', 'intro', 'seed'),
    ('Closing', 'Sign-off lines', 'closing', 'seed');

INSERT INTO dbo.DefaultBlockSnippets
    (BlockId, Label, Content, SortOrder, IsApproved, CreatedBy)
VALUES
    (1, 'Friendly intro', 'Hi there, hope you are well.', 1, 1, 'seed'),
    (1, 'Formal intro', 'Dear [Name], we appreciate your interest.', 2, 1, 'seed'),
    (2, 'Thanks', 'Thanks for your time.', 1, 1, 'seed'),
    (2, 'Looking forward', 'I look forward to hearing from you.', 2, 1, 'seed');

INSERT INTO dbo.DefaultBlockSnippetVersions
    (SnippetId, VersionNumber, Label, Content, SortOrder, BlockId, ApprovedBy, ApprovedAt)
SELECT
    SnippetId,
    Version,
    Label,
    Content,
    SortOrder,
    BlockId,
    'seed' AS ApprovedBy,
    SYSUTCDATETIME() AS ApprovedAt
FROM dbo.DefaultBlockSnippets;

INSERT INTO dbo.DefaultSnippetEdits
    (SnippetId, ProposedContent, ProposedLabel, ProposedBy)
VALUES
    (1, 'Hi {name}, hope all is well!', 'Friendly intro v2', 'tester');
