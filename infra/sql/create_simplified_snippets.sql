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


CREATE TABLE dbo.SimplifiedBlockSnippets
(
    SnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlocks(BlockId),
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

CREATE INDEX IX_SimplifiedBlockSnippets_BlockId ON dbo.SimplifiedBlockSnippets(BlockId);

CREATE TABLE dbo.SimplifiedBlockSnippetVersions
(
    VersionId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlockSnippets(SnippetId),
    VersionNumber INT NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlocks(BlockId),
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.SnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,

ProposedLabel NVARCHAR
(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES dbo.SimplifiedBlocks
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

CREATE INDEX IX_SnippetEdits_SnippetId ON dbo.SnippetEdits(SnippetId);

GO

-- ---------------------------------------------------------------
-- Sample data to support local development and testing
-- ---------------------------------------------------------------

INSERT INTO dbo.SimplifiedBlocks
    (Title, Description, Placeholder, CreatedBy)
VALUES
    ('Opening', 'Introductory lines', 'intro', 'seed'),
    ('Closing', 'Sign-off lines', 'closing', 'seed');

INSERT INTO dbo.SimplifiedBlockSnippets
    (BlockId, Label, Content, SortOrder, IsApproved, CreatedBy)
VALUES
    (1, 'Friendly intro', 'Hi there, hope you are well.', 1, 1, 'seed'),
    (1, 'Formal intro', 'Dear [Name], we appreciate your interest.', 2, 1, 'seed'),
    (2, 'Thanks', 'Thanks for your time.', 1, 1, 'seed'),
    (2, 'Looking forward', 'I look forward to hearing from you.', 2, 1, 'seed');

INSERT INTO dbo.SimplifiedBlockSnippetVersions
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
FROM dbo.SimplifiedBlockSnippets;

INSERT INTO dbo.SnippetEdits
    (SnippetId, ProposedContent, ProposedLabel, ProposedBy)
VALUES
    (1, 'Hi {name}, hope all is well!', 'Friendly intro v2', 'tester');
