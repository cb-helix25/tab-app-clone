// src/tabs/home/RecentWorkFeed.tsx
// Component to display recent git commits as a work activity feed

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
  Separator,
  TooltipHost
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import {
  fetchGitHubCommits,
  formatCommitMessage,
  getRelativeTime,
  getChangeColor
} from '../../services/gitHistoryService';

import type { GitCommit } from '../../services/gitHistoryService';

interface RecentWorkFeedProps {
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

const RecentWorkFeed: React.FC<RecentWorkFeedProps> = ({
  maxItems = 10,
  showHeader = true,
  compact = false
}) => {
  const { isDarkMode } = useTheme();
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Load git history on component mount
  const loadGitHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGitHubCommits();
      // Map GitHub API data to GitCommit[]
      const mappedCommits: GitCommit[] = data.slice(0, maxItems).map((commit: any) => ({
        hash: commit.sha,
        author: commit.commit.author.name,
        message: commit.commit.message,
        timestamp: commit.commit.author.date,
        filesChanged: commit.files ? commit.files.length : 0,
        insertions: commit.stats ? commit.stats.additions : 0,
        deletions: commit.stats ? commit.stats.deletions : 0
      }));
      setCommits(mappedCommits);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load git history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent work');
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    loadGitHistory();
  }, [loadGitHistory]);

  // Styles
  const cardStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: '8px',
    padding: compact ? '12px' : '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)',
      transition: 'all 0.2s ease-in-out'
    }
  });

  const headerStyle = mergeStyles({
    marginBottom: '16px'
  });

  const commitItemStyle = mergeStyles({
    padding: compact ? '8px 0' : '12px 0',
    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    '&:last-child': {
      borderBottom: 'none'
    },
    '&:hover': {
      backgroundColor: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
      margin: compact ? '0 -8px' : '0 -12px',
      padding: compact ? '8px 8px' : '12px 12px',
      borderRadius: '4px',
      transition: 'all 0.15s ease-in-out'
    }
  });

  const commitHashStyle = mergeStyles({
    fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
    fontSize: '11px',
    color: isDarkMode ? colours.greyText : colours.greyText,
    backgroundColor: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
    padding: '2px 6px',
    borderRadius: '3px',
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    marginRight: '8px'
  });

  const statsStyle = mergeStyles({
    fontSize: '11px',
    color: isDarkMode ? colours.greyText : colours.greyText,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const refreshButtonStyle = mergeStyles({
    cursor: 'pointer',
    color: isDarkMode ? colours.blue : colours.blue,
    '&:hover': {
      color: isDarkMode ? colours.highlight : colours.highlight
    }
  });

  // Loading shimmer
  const renderLoadingShimmer = () => (
    <Stack tokens={{ childrenGap: 12 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Stack key={index} tokens={{ childrenGap: 8 }}>
          <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
            <Shimmer 
              shimmerElements={[{ type: ShimmerElementType.circle, height: 32 }]} 
              width="32px" 
            />
            <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
              <Shimmer 
                shimmerElements={[{ type: ShimmerElementType.line, height: 14 }]} 
                width="70%" 
              />
              <Shimmer 
                shimmerElements={[{ type: ShimmerElementType.line, height: 12 }]} 
                width="40%" 
              />
            </Stack>
          </Stack>
          {index < 4 && <Separator />}
        </Stack>
      ))}
    </Stack>
  );

  // Render individual commit
  const renderCommit = (commit: GitCommit, index: number) => {
    const changeColor = getChangeColor(commit.insertions, commit.deletions);
    const totalChanges = commit.insertions + commit.deletions;
    
    return (
      <div key={commit.hash} className={commitItemStyle}>
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="start">
          {/* Author Avatar */}
          <Persona
            size={PersonaSize.size32}
            text={commit.author}
            initialsTextColor="white"
            hidePersonaDetails
          />
          
          {/* Commit Details */}
          <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text 
                variant="small" 
                styles={{ 
                  root: { 
                    fontWeight: 500,
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    lineHeight: '1.4',
                    flex: 1
                  } 
                }}
              >
                {formatCommitMessage(commit.message)}
              </Text>
              <Text 
                variant="tiny" 
                styles={{ 
                  root: { 
                    color: isDarkMode ? colours.greyText : colours.greyText,
                    whiteSpace: 'nowrap'
                  } 
                }}
              >
              </Text>
            </Stack>
            
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <span className={commitHashStyle}>
                {commit.hash.substring(0, 7)}
              </span>
              
              {!compact && (
                <div className={statsStyle}>
                  <TooltipHost content={`${commit.insertions} additions, ${commit.deletions} deletions`}>
                    <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                      <Icon 
                        iconName="FileCode" 
                        styles={{ root: { fontSize: '10px' } }} 
                      />
                      <Text variant="tiny">{commit.filesChanged}</Text>
                      
                      {totalChanges > 0 && (
                        <>
                          <div 
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: changeColor,
                              marginLeft: '4px'
                            }}
                          />
                          <Text variant="tiny">+{commit.insertions}/-{commit.deletions}</Text>
                        </>
                      )}
                    </Stack>
                  </TooltipHost>
                </div>
              )}
            </Stack>
            
            <Text 
              variant="tiny" 
              styles={{ 
                root: { 
                  color: isDarkMode ? colours.greyText : colours.greyText 
                } 
              }}
            >
              by {commit.author.replace(/<[^>]*>/g, '').trim()}
            </Text>
          </Stack>
        </Stack>
      </div>
    );
  };

  return (
    <div className={cardStyle}>
      {showHeader && (
        <div className={headerStyle}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon 
              iconName="RecentActivities" 
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
              Recent Work Completed
            </Text>
            {!loading && (
              <TooltipHost content="Refresh">
                <Icon 
                  iconName="Refresh" 
                  className={refreshButtonStyle}
                  onClick={loadGitHistory}
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
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
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
            <button onClick={loadGitHistory} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              Retry
            </button>
          }
        >
          {error}
        </MessageBar>
      )}

      {/* Loading State */}
      {loading && renderLoadingShimmer()}

      {/* Content State */}
      {!loading && !error && (
        <Stack tokens={{ childrenGap: 0 }}>
          {commits.length === 0 ? (
            <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }} styles={{ root: { padding: '24px' } }}>
              <Icon 
                iconName="GitGraph" 
                styles={{ 
                  root: { 
                    fontSize: '32px',
                    color: isDarkMode ? colours.greyText : colours.greyText 
                  } 
                }} 
              />
              <Text 
                variant="medium" 
                styles={{ 
                  root: { 
                    color: isDarkMode ? colours.greyText : colours.greyText,
                    textAlign: 'center'
                  } 
                }}
              >
                No recent commits found
              </Text>
            </Stack>
          ) : (
            commits.map(renderCommit)
          )}
        </Stack>
      )}
    </div>
  );
};

export default RecentWorkFeed;