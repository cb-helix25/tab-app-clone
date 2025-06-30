-- SQL schema for pitch builder default blocks and snippet edits
-- Tables live in the same database as the Instructions app

CREATE TABLE pitchbuilder.DefaultBlocks
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
CREATE TABLE pitchbuilder.EditStatuses
(
    Status NVARCHAR(20) PRIMARY KEY
);

INSERT INTO pitchbuilder.EditStatuses
    (Status)
VALUES
    ('pending'),
    ('approved'),
    ('rejected');


CREATE TABLE pitchbuilder.DefaultBlockSnippets
(
    SnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
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

CREATE INDEX IX_DefaultBlockSnippets_BlockId ON pitchbuilder.DefaultBlockSnippets(BlockId);

CREATE TABLE pitchbuilder.DefaultBlockSnippetVersions
(
    VersionId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlockSnippets(SnippetId),
    VersionNumber INT NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE pitchbuilder.DefaultSnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,

    ProposedLabel NVARCHAR
(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks
(BlockId),
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    Status NVARCHAR
(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES pitchbuilder.EditStatuses
(Status),
    ReviewNotes NVARCHAR
(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);

CREATE INDEX IX_DefaultSnippetEdits_SnippetId ON pitchbuilder.DefaultSnippetEdits(SnippetId);

CREATE TABLE pitchbuilder.PlaceholderSnippets
(
    PlaceholderSnippetId INT IDENTITY(1,1) PRIMARY KEY,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
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

CREATE INDEX IX_PlaceholderSnippets_BlockId ON pitchbuilder.PlaceholderSnippets(BlockId);

CREATE TABLE pitchbuilder.PlaceholderSnippetVersions
(
    VersionId INT IDENTITY(1,1) PRIMARY KEY,
    PlaceholderSnippetId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.PlaceholderSnippets(PlaceholderSnippetId),
    VersionNumber INT NOT NULL,
    Label NVARCHAR(100) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SortOrder INT NOT NULL,
    BlockId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
    Placeholder NVARCHAR(100) NOT NULL,
    ApprovedBy NVARCHAR(50) NULL,
    ApprovedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE pitchbuilder.PlaceholderSnippetEdits
(
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    PlaceholderSnippetId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.PlaceholderSnippets(PlaceholderSnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,
    ProposedLabel NVARCHAR(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
    ProposedPlaceholder NVARCHAR(100) NULL,
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES pitchbuilder.EditStatuses(Status),
    ReviewNotes NVARCHAR(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);

CREATE INDEX IX_PlaceholderSnippetEdits_PlaceholderSnippetId ON pitchbuilder.PlaceholderSnippetEdits(PlaceholderSnippetId);

GO

-- ---------------------------------------------------------------
-- Sample data to support local development and testing
-- ---------------------------------------------------------------

INSERT INTO pitchbuilder.DefaultBlocks
    (Title, Description, Placeholder, CreatedBy)
VALUES
    ('Opening', 'Introductory lines', 'intro', 'seed'),
    ('Closing', 'Sign-off lines', 'closing', 'seed');

INSERT INTO pitchbuilder.DefaultBlockSnippets
    (BlockId, Label, Content, SortOrder, IsApproved, CreatedBy)
VALUES
    (1, 'Friendly intro', 'Hi there, hope you are well.', 1, 1, 'seed'),
    (1, 'Formal intro', 'Dear [Name], we appreciate your interest.', 2, 1, 'seed'),
    (2, 'Thanks', 'Thanks for your time.', 1, 1, 'seed'),
    (2, 'Looking forward', 'I look forward to hearing from you.', 2, 1, 'seed');

INSERT INTO pitchbuilder.DefaultBlockSnippetVersions
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
FROM pitchbuilder.DefaultBlockSnippets;

INSERT INTO pitchbuilder.DefaultSnippetEdits
    (SnippetId, ProposedContent, ProposedLabel, ProposedBy)
VALUES
    (1, 'Hi {name}, hope all is well!', 'Friendly intro v2', 'tester');

-- Sample placeholder snippets
INSERT INTO pitchbuilder.PlaceholderSnippets
    (BlockId, Placeholder, Label, Content, SortOrder, IsApproved, CreatedBy)
VALUES
    (1, 'introName', 'introName', '[Name]', 1, 1, 'seed'),
    (2, 'closingSignOff', 'closingSignOff', 'Kind regards', 1, 1, 'seed');

INSERT INTO pitchbuilder.PlaceholderSnippetVersions
    (PlaceholderSnippetId, VersionNumber, Label, Content, SortOrder, BlockId, Placeholder, ApprovedBy, ApprovedAt)
SELECT
    PlaceholderSnippetId,
    Version,
    Label,
    Content,
    SortOrder,
    BlockId,
    Placeholder,
    'seed' AS ApprovedBy,
    SYSUTCDATETIME() AS ApprovedAt
FROM pitchbuilder.PlaceholderSnippets;

INSERT INTO pitchbuilder.PlaceholderSnippetEdits
    (PlaceholderSnippetId, ProposedContent, ProposedLabel, ProposedBy)
VALUES
    (1, '[New Name]', 'introName', 'tester');