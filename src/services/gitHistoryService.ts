// src/services/gitHistoryService.ts
// Service for fetching and formatting git commit history data

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  timestamp: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GitHistoryResponse {
  commits: GitCommit[];
  totalCommits: number;
  lastUpdated: string;
}

/**
 * Fetches recent git commit history from the Express server
 * @param limit Number of commits to fetch (default: 10)
 * @returns Promise<GitHistoryResponse>
 */
export const fetchGitHistory = async (limit: number = 10): Promise<GitHistoryResponse> => {
  try {
    const response = await fetch(`/api/git/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch git history: ${response.status} ${response.statusText}`);
    }
    
    const data: GitHistoryResponse = await response.json();
    
    // Format dates and ensure data integrity
    const formattedCommits = data.commits.map(commit => ({
      ...commit,
      timestamp: new Date(commit.date).getTime(),
      // Ensure numeric values are numbers
      filesChanged: Number(commit.filesChanged) || 0,
      insertions: Number(commit.insertions) || 0,
      deletions: Number(commit.deletions) || 0
    }));
    
    return {
      ...data,
      commits: formattedCommits,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching git history:', error);
    throw error;
  }
};

/**
 * Formats a commit message for display
 * Truncates long messages and capitalizes first letter
 */
export const formatCommitMessage = (message: string, maxLength: number = 80): string => {
  if (!message) return 'No commit message';
  
  // Clean up common prefixes
  let cleaned = message
    .replace(/^(feat|fix|docs|style|refactor|test|chore)(\([^)]*\))?:\s*/i, '')
    .trim();
  
  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...';
  }
  
  return cleaned;
};

/**
 * Gets a relative time string for a commit date
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Gets initials from author name for avatar display
 */
export const getAuthorInitials = (author: string): string => {
  if (!author) return '??';
  
  // Remove email if present
  const name = author.replace(/<[^>]*>/g, '').trim();
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Determines the color for change statistics based on the type and amount
 */
export const getChangeColor = (insertions: number, deletions: number): string => {
  const total = insertions + deletions;
  if (total === 0) return '#666666';
  
  const ratio = insertions / (insertions + deletions);
  
  if (ratio > 0.7) return '#28a745'; // Mostly additions - green
  if (ratio < 0.3) return '#dc3545'; // Mostly deletions - red
  return '#ffc107'; // Mixed changes - yellow/orange
};