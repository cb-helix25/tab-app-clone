-- Sample placeholder snippets for production testing
DELETE FROM pitchbuilder.PlaceholderSnippetVersions;
DELETE FROM pitchbuilder.PlaceholderSnippetEdits;
DELETE FROM pitchbuilder.PlaceholderSnippets;

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