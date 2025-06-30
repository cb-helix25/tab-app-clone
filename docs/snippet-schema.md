# Pitch Builder Snippet Database

This file lists the SQL statements used to create the tables that support the snippet editing workflow. Each table is defined in `infra/sql/create_simplified_snippets.sql`.

## Table definitions

```sql
CREATE TABLE dbo.DefaultBlocks (
    BlockId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(400) NULL,
    Placeholder NVARCHAR(100) NOT NULL,
    CreatedBy NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NULL
);
```
The **DefaultBlocks** table stores the high level blocks that appear in the editor. Each block has a title, optional description and placeholder.

```sql
CREATE TABLE dbo.EditStatuses (
    Status NVARCHAR(20) PRIMARY KEY
);
```
`EditStatuses` acts as a lookup to enforce valid status values for snippet edits.

```sql
CREATE TABLE dbo.DefaultBlockSnippets (
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
```
`DefaultBlockSnippets` holds the actual snippet text for each block. A snippet may have multiple versions over time.

```sql
CREATE TABLE dbo.DefaultBlockSnippetVersions (
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
```
Each approved change creates an entry in **DefaultBlockSnippetVersions** so that prior text can be retrieved.

```sql
CREATE TABLE dbo.DefaultSnippetEdits (
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES dbo.DefaultBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,
    ProposedLabel NVARCHAR(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES dbo.DefaultBlocks(BlockId),
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES dbo.EditStatuses(Status),
    ReviewNotes NVARCHAR(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);
```
The **SnippetEdits** table stores pending modifications to snippets. Once reviewed the status changes to `approved` or `rejected`.

### Placeholder snippet tables

Blocks may also contain editable placeholders. The following tables mirror the block snippet structure but store snippet options scoped to a specific placeholder within a block.

```sql
CREATE TABLE dbo.PlaceholderSnippets (
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

CREATE TABLE dbo.PlaceholderSnippetVersions (
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

CREATE TABLE dbo.PlaceholderSnippetEdits (
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
```

These tables allow multiple approved snippets for each placeholder and maintain a history of changes just like the block-level tables.

## Inserting v2 blocks

The file `infra/sql/insert_v2_blocks.sql` contains the data inserts for the current v2 block set used by the editor.
