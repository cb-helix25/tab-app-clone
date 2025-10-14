// src/tabs/home/TeamIssuesBoard.tsx
// Lightweight issues board for tracking team blockers and work ownership

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  mergeStyles,
  Icon,
  Persona,
  PersonaSize,
  MessageBar,
  MessageBarType,
  Shimmer,
  ShimmerElementType,
  TooltipHost,
  DefaultButton,
  IconButton,
  Panel,
  PanelType,
  TextField,
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  ActionButton
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import {
  fetchTeamIssues,
  TeamIssue,
  TeamIssuesResponse,
  getPriorityColor,
  getStatusColor,
  formatStatusText,
  getRelativeTime,
  getInitials
} from '../../services/teamIssuesService';

interface TeamIssuesBoardProps {
  showHeader?: boolean;
  compact?: boolean;
  maxItemsPerColumn?: number;
}

const TeamIssuesBoard: React.FC<TeamIssuesBoardProps> = ({
  showHeader = true,
  compact = false,
  maxItemsPerColumn = 4
}) => {
  const { isDarkMode } = useTheme();
  const [issuesData, setIssuesData] = useState<TeamIssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [showNewIssuePanel, setShowNewIssuePanel] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TeamIssue['priority'],
    reporter: '',
    tags: ''
  });

  // Load issues data on component mount
  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTeamIssues();
      setIssuesData(data);
      setLastUpdated(data.metadata.lastUpdated);
    } catch (err) {
      console.error('Failed to load team issues:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team issues');
    } finally {
      setLoading(false);
    }
  };

  // Toggle column expansion
  const toggleColumnExpansion = (columnKey: string) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  // Handle new issue form
  const handleNewIssueSubmit = () => {
    if (!newIssueForm.title.trim() || !newIssueForm.description.trim() || !newIssueForm.reporter.trim()) {
      setError('Please fill in all required fields (Title, Description, Reporter)');
      return;
    }

    // Generate a new issue ID
    const newId = `ISSUE-${String(Date.now()).slice(-3).padStart(3, '0')}`;
    
    // Create new issue object
    const newIssue: TeamIssue = {
      id: newId,
      title: newIssueForm.title.trim(),
      description: newIssueForm.description.trim(),
      status: 'new',
      priority: newIssueForm.priority,
      reporter: newIssueForm.reporter.trim(),
      createdAt: new Date().toISOString(),
      tags: newIssueForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    // Add to current issues data
    if (issuesData) {
      const updatedIssues = [...issuesData.issues, newIssue];
      const updatedData: TeamIssuesResponse = {
        ...issuesData,
        issues: updatedIssues,
        metadata: {
          ...issuesData.metadata,
          totalIssues: updatedIssues.length,
          lastUpdated: new Date().toISOString(),
          statusCounts: {
            ...issuesData.metadata.statusCounts,
            new: issuesData.metadata.statusCounts.new + 1
          },
          priorityCounts: {
            ...issuesData.metadata.priorityCounts,
            [newIssueForm.priority]: issuesData.metadata.priorityCounts[newIssueForm.priority] + 1
          }
        }
      };
      setIssuesData(updatedData);
      setLastUpdated(updatedData.metadata.lastUpdated);
    }

    // Reset form and close panel
    setNewIssueForm({
      title: '',
      description: '',
      priority: 'medium',
      reporter: '',
      tags: ''
    });
    setShowNewIssuePanel(false);
    setError(null);
  };

  const handleCancelNewIssue = () => {
    setNewIssueForm({
      title: '',
      description: '',
      priority: 'medium',
      reporter: '',
      tags: ''
    });
    setShowNewIssuePanel(false);
    setError(null);
  };

  // Group issues by status
  const groupedIssues = React.useMemo(() => {
    if (!issuesData) return { new: [], 'in-progress': [], blocked: [], resolved: [] };
    
    return issuesData.issues.reduce((groups, issue) => {
      if (!groups[issue.status]) groups[issue.status] = [];
      groups[issue.status].push(issue);
      return groups;
    }, {
      new: [],
      'in-progress': [],
      blocked: [],
      resolved: []
    } as Record<TeamIssue['status'], TeamIssue[]>);
  }, [issuesData]);

  // Styles
  const boardStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: '8px',
    padding: compact ? '12px' : '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  });

  const headerStyle = mergeStyles({
    marginBottom: '16px'
  });

  const columnsContainerStyle = mergeStyles({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '12px'
    }
  });

  const columnStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardHover,
    borderRadius: '6px',
    padding: '12px',
    minHeight: '200px'
  });

  const columnHeaderStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
  });

  const issueCardStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)',
      transition: 'all 0.2s ease-in-out'
    }
  });

  const priorityDotStyle = (priority: TeamIssue['priority']) => mergeStyles({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: getPriorityColor(priority),
    marginRight: '6px'
  });

  const tagStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.border : colours.light.border,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    marginRight: '4px',
    marginBottom: '2px'
  });

  const refreshButtonStyle = mergeStyles({
    cursor: 'pointer',
    color: isDarkMode ? colours.blue : colours.blue,
    '&:hover': {
      color: isDarkMode ? colours.highlight : colours.highlight
    }
  });

  // Priority options for dropdown
  const priorityOptions: IDropdownOption[] = [
    { key: 'low', text: 'Low Priority' },
    { key: 'medium', text: 'Medium Priority' },
    { key: 'high', text: 'High Priority' }
  ];

  // Column configurations
  const columns = [
    { key: 'new' as const, title: 'New', icon: 'StatusCircleInner', color: '#007bff' },
    { key: 'in-progress' as const, title: 'In Progress', icon: 'Processing', color: '#17a2b8' },
    { key: 'blocked' as const, title: 'Blocked', icon: 'Blocked', color: '#dc3545' },
    { key: 'resolved' as const, title: 'Resolved', icon: 'Completed', color: '#28a745' }
  ];

  // Loading shimmer
  const renderLoadingShimmer = () => (
    <div className={columnsContainerStyle}>
      {columns.map((column) => (
        <div key={column.key} className={columnStyle}>
          <Stack tokens={{ childrenGap: 8 }}>
            <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 20 }]} width="60%" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{ 
                backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                borderRadius: '4px',
                padding: '8px'
              }}>
                <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 14 }]} width="80%" />
                <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 12 }]} width="60%" />
              </div>
            ))}
          </Stack>
        </div>
      ))}
    </div>
  );

  // Render individual issue card
  const renderIssueCard = (issue: TeamIssue) => (
    <TooltipHost
      key={issue.id}
      content={
        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="small" styles={{ root: { fontWeight: 600 } }}>{issue.title}</Text>
          <Text variant="tiny">{issue.description}</Text>
          <Text variant="tiny">Reporter: {issue.reporter}</Text>
          <Text variant="tiny">Created: {getRelativeTime(issue.createdAt)}</Text>
          {issue.tags.length > 0 && (
            <Text variant="tiny">Tags: {issue.tags.join(', ')}</Text>
          )}
        </Stack>
      }
    >
      <div className={issueCardStyle}>
        <Stack tokens={{ childrenGap: 4 }}>
          {/* Title and Priority */}
          <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
            <div className={priorityDotStyle(issue.priority)} />
            <Text 
              variant="small" 
              styles={{ 
                root: { 
                  fontWeight: 500,
                  flex: 1,
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  lineHeight: '1.3'
                } 
              }}
            >
              {issue.title}
            </Text>
          </Stack>

          {/* Issue ID and Reporter */}
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.greyText : colours.greyText,
                  fontFamily: 'Monaco, Consolas, monospace'
                } 
              }}
            >
              {issue.id}
            </Text>
            
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.greyText : colours.greyText 
                } 
              }}
            >
              by {issue.reporter}
            </Text>
          </Stack>

          {/* Tags */}
          {issue.tags.length > 0 && (
            <Stack horizontal wrap tokens={{ childrenGap: 2 }}>
              {issue.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={tagStyle}>
                  {tag}
                </span>
              ))}
              {issue.tags.length > 2 && (
                <Text variant="tiny" styles={{ root: { color: isDarkMode ? colours.greyText : colours.greyText } }}>
                  +{issue.tags.length - 2} more
                </Text>
              )}
            </Stack>
          )}

          {/* Created time */}
          <Text 
            variant="tiny" 
            styles={{ 
              root: { 
                color: isDarkMode ? colours.greyText : colours.greyText,
                alignSelf: 'flex-end'
              } 
            }}
          >
            {getRelativeTime(issue.createdAt)}
          </Text>
        </Stack>
      </div>
    </TooltipHost>
  );

  // Render column
  const renderColumn = (column: { key: TeamIssue['status']; title: string; icon: string; color: string }) => {
    const issues = groupedIssues[column.key] || [];
    const isExpanded = expandedColumns.has(column.key);
    const displayIssues = isExpanded ? issues : issues.slice(0, maxItemsPerColumn);
    const hasMore = !isExpanded && issues.length > maxItemsPerColumn;

    return (
      <div key={column.key} className={columnStyle}>
        <div className={columnHeaderStyle}>
          <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
            <Icon 
              iconName={column.icon} 
              styles={{ 
                root: { 
                  fontSize: '14px',
                  color: column.color
                } 
              }} 
            />
            <Text 
              variant="medium" 
              styles={{ 
                root: { 
                  fontWeight: 600,
                  color: isDarkMode ? colours.dark.text : colours.light.text
                } 
              }}
            >
              {column.title}
            </Text>
            {column.key === 'new' && (
              <TooltipHost content="Add new issue">
                <IconButton
                  iconProps={{ iconName: 'Add' }}
                  onClick={() => setShowNewIssuePanel(true)}
                  styles={{
                    root: {
                      color: isDarkMode ? colours.blue : colours.blue,
                      fontSize: '12px',
                      width: '20px',
                      height: '20px',
                      '&:hover': {
                        color: isDarkMode ? colours.highlight : colours.highlight,
                        backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardHover
                      }
                    }
                  }}
                />
              </TooltipHost>
            )}
          </Stack>
          
          <Text 
            variant="small" 
            styles={{ 
              root: { 
                backgroundColor: column.color,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600
              } 
            }}
          >
            {issues.length}
          </Text>
        </div>

        <Stack tokens={{ childrenGap: 0 }}>
          {displayIssues.map(renderIssueCard)}
          
          {hasMore && (
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.blue : colours.blue,
                  textAlign: 'center',
                  padding: '8px',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  '&:hover': {
                    color: isDarkMode ? colours.highlight : colours.highlight,
                    textDecoration: 'underline'
                  }
                } 
              }}
              onClick={() => toggleColumnExpansion(column.key)}
            >
              +{issues.length - maxItemsPerColumn} more
            </Text>
          )}
          
          {isExpanded && issues.length > maxItemsPerColumn && (
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.blue : colours.blue,
                  textAlign: 'center',
                  padding: '8px',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  '&:hover': {
                    color: isDarkMode ? colours.highlight : colours.highlight,
                    textDecoration: 'underline'
                  }
                } 
              }}
              onClick={() => toggleColumnExpansion(column.key)}
            >
              Show less
            </Text>
          )}
          
          {issues.length === 0 && (
            <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { padding: '16px' } }}>
              <Icon 
                iconName="CheckMark" 
                styles={{ 
                  root: { 
                    fontSize: '24px',
                    color: isDarkMode ? colours.greyText : colours.greyText,
                    opacity: 0.5
                  } 
                }} 
              />
              <Text 
                variant="small" 
                styles={{ 
                  root: { 
                    color: isDarkMode ? colours.greyText : colours.greyText,
                    textAlign: 'center',
                    fontStyle: 'italic'
                  } 
                }}
              >
                No issues
              </Text>
            </Stack>
          )}
        </Stack>
      </div>
    );
  };

  return (
    <div className={boardStyle}>
      {showHeader && (
        <div className={headerStyle}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon 
              iconName="IssueTracking" 
              styles={{ 
                root: { 
                  fontSize: '16px',
                  color: isDarkMode ? colours.blue : colours.blue
                } 
              }} 
            />
            <Text 
              variant="mediumPlus" 
              styles={{ 
                root: { 
                  fontWeight: 600,
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  flex: 1
                } 
              }}
            >
              Team Issues Board
            </Text>
            
            {issuesData && (
              <Text 
                variant="small" 
                styles={{ 
                  root: { 
                    color: isDarkMode ? colours.greyText : colours.greyText 
                  } 
                }}
              >
                {issuesData.metadata.totalIssues} total
              </Text>
            )}
            
            {!loading && (
              <TooltipHost content="Refresh">
                <IconButton
                  iconProps={{ iconName: 'Refresh' }}
                  className={refreshButtonStyle}
                  onClick={loadIssues}
                  styles={{ root: { fontSize: '14px' } }}
                />
              </TooltipHost>
            )}
          </Stack>
          
          {lastUpdated && !loading && (
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.greyText : colours.greyText,
                  marginTop: '4px'
                } 
              }}
            >
              Updated: {getRelativeTime(lastUpdated)}
            </Text>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <MessageBar 
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
          actions={
            <DefaultButton onClick={loadIssues} text="Retry" />
          }
        >
          {error}
        </MessageBar>
      )}

      {/* Loading State */}
      {loading && renderLoadingShimmer()}

      {/* Content State */}
      {!loading && !error && issuesData && (
        <div className={columnsContainerStyle}>
          {columns.map(renderColumn)}
        </div>
      )}

      {/* New Issue Panel */}
      <Panel
        isOpen={showNewIssuePanel}
        onDismiss={handleCancelNewIssue}
        type={PanelType.medium}
        headerText="Create New Issue"
        closeButtonAriaLabel="Close"
        styles={{
          content: {
            backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground
          },
          header: {
            backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground
          }
        }}
      >
        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: '16px 0' } }}>
          <TextField
            label="Title"
            required
            placeholder="Enter issue title"
            value={newIssueForm.title}
            onChange={(_, newValue) => setNewIssueForm(prev => ({ ...prev, title: newValue || '' }))}
            styles={{
              fieldGroup: {
                backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
              }
            }}
          />

          <TextField
            label="Description"
            required
            multiline
            rows={4}
            placeholder="Describe the issue in detail"
            value={newIssueForm.description}
            onChange={(_, newValue) => setNewIssueForm(prev => ({ ...prev, description: newValue || '' }))}
            styles={{
              fieldGroup: {
                backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
              }
            }}
          />

          <Dropdown
            label="Priority"
            required
            options={priorityOptions}
            selectedKey={newIssueForm.priority}
            onChange={(_, option) => setNewIssueForm(prev => ({ ...prev, priority: option?.key as TeamIssue['priority'] || 'medium' }))}
            styles={{
              dropdown: {
                backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
              }
            }}
          />

          <TextField
            label="Reporter"
            required
            placeholder="Enter reporter initials (e.g., JD)"
            value={newIssueForm.reporter}
            onChange={(_, newValue) => setNewIssueForm(prev => ({ ...prev, reporter: newValue || '' }))}
            styles={{
              fieldGroup: {
                backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
              }
            }}
          />

          <TextField
            label="Tags"
            placeholder="Enter tags separated by commas (e.g., bug, ui, urgent)"
            value={newIssueForm.tags}
            onChange={(_, newValue) => setNewIssueForm(prev => ({ ...prev, tags: newValue || '' }))}
            styles={{
              fieldGroup: {
                backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
              }
            }}
          />

          <Stack horizontal tokens={{ childrenGap: 12 }} horizontalAlign="end" styles={{ root: { marginTop: '24px' } }}>
            <DefaultButton
              text="Cancel"
              onClick={handleCancelNewIssue}
              styles={{
                root: {
                  border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                  backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.cardBackground,
                  color: isDarkMode ? colours.dark.text : colours.light.text
                }
              }}
            />
            <PrimaryButton
              text="Create Issue"
              onClick={handleNewIssueSubmit}
              disabled={!newIssueForm.title.trim() || !newIssueForm.description.trim() || !newIssueForm.reporter.trim()}
            />
          </Stack>
        </Stack>
      </Panel>
    </div>
  );
};

export default TeamIssuesBoard;