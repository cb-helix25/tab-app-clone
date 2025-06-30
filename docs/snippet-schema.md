# Pitch Builder Snippet Database

This file lists the SQL statements used to create the tables that support the snippet editing workflow. Each table is defined in `infra/sql/create_simplified_snippets.sql`.

## Table definitions

```sql
CREATE TABLE pitchbuilder.DefaultBlocks (
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
CREATE TABLE pitchbuilder.EditStatuses (
    Status NVARCHAR(20) PRIMARY KEY
);
```
`EditStatuses` acts as a lookup to enforce valid status values for snippet edits.

```sql
CREATE TABLE pitchbuilder.DefaultBlockSnippets (
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
```
`DefaultBlockSnippets` holds the actual snippet text for each block. A snippet may have multiple versions over time.

```sql
CREATE TABLE pitchbuilder.DefaultBlockSnippetVersions (
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
```
Each approved change creates an entry in **DefaultBlockSnippetVersions** so that prior text can be retrieved.

```sql
CREATE TABLE pitchbuilder.DefaultSnippetEdits (
    EditId INT IDENTITY(1,1) PRIMARY KEY,
    SnippetId INT NOT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlockSnippets(SnippetId),
    ProposedContent NVARCHAR(MAX) NOT NULL,
    ProposedLabel NVARCHAR(100) NULL,
    ProposedSortOrder INT NULL,
    ProposedBlockId INT NULL FOREIGN KEY REFERENCES pitchbuilder.DefaultBlocks(BlockId),
    IsNew BIT NOT NULL DEFAULT 0,
    ProposedBy NVARCHAR(50) NOT NULL,
    ProposedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'pending' FOREIGN KEY REFERENCES pitchbuilder.EditStatuses(Status),
    ReviewNotes NVARCHAR(400) NULL,
    ReviewedBy NVARCHAR(50) NULL,
    ReviewedAt DATETIME2 NULL
);
```
The **SnippetEdits** table stores pending modifications to snippets. Once reviewed the status changes to `approved` or `rejected`.

### Placeholder snippet tables

Blocks may also contain editable placeholders. The following tables mirror the block snippet structure but store snippet options scoped to a specific placeholder within a block.

```sql
CREATE TABLE pitchbuilder.PlaceholderSnippets (
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

CREATE TABLE pitchbuilder.PlaceholderSnippetVersions (
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

CREATE TABLE pitchbuilder.PlaceholderSnippetEdits (
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
```

These tables allow multiple approved snippets for each placeholder and maintain a history of changes just like the block-level tables.

## Inserting v2 blocks

The file `infra/sql/insert_v2_blocks.sql` contains the data inserts for the current v2 block set used by the editor.

## Sample placeholder snippet data

`create_simplified_snippets.sql` seeds a few placeholder snippets for local development. To load similar data in another environment, run the statements below or execute `infra/sql/insert_placeholder_sample_data.sql`.

```sql
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
    'seed',
    SYSUTCDATETIME()
FROM pitchbuilder.PlaceholderSnippets;
```
