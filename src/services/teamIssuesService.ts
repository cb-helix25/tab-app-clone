// src/services/teamIssuesService.ts
// Service for loading team issues data from local JSON or API endpoint

export interface TeamIssue {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'in-progress' | 'blocked' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reporter: string;
  createdAt: string;
  tags: string[];
  resolvedAt?: string;
}

export interface TeamIssuesResponse {
  issues: TeamIssue[];
  metadata: {
    totalIssues: number;
    lastUpdated: string;
    statusCounts: {
      new: number;
      'in-progress': number;
      blocked: number;
      resolved: number;
    };
    priorityCounts: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

/**
 * Fetches team issues data from API or local JSON
 */
export const fetchTeamIssues = async (): Promise<TeamIssuesResponse> => {
  const useLocalData = process.env.REACT_APP_USE_LOCAL_DATA === 'true';
  
  if (useLocalData) {
    // Load from local JSON file
    try {
      const localIssues = await import('../localData/localIssues.json');
      return localIssues.default as TeamIssuesResponse;
    } catch (error) {
      console.error('Error loading local issues data:', error);
      return getFallbackIssues();
    }
  }

  // Try to fetch from API endpoint
  try {
    const response = await fetch('/api/team-issues');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team issues: ${response.status}`);
    }
    
    const data: TeamIssuesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team issues from API:', error);
    
    // Fallback to mock data if API fails
    return getFallbackIssues();
  }
};

/**
 * Returns fallback issues data when both local and API loading fail
 */
const getFallbackIssues = (): TeamIssuesResponse => {
  const fallbackIssues: TeamIssue[] = [
    {
      id: 'FALLBACK-001',
      title: 'Connection issue',
      description: 'Unable to load team issues data',
      status: 'new',
      priority: 'medium',
      reporter: 'SYSTEM',
      createdAt: new Date().toISOString(),
      tags: ['system', 'connectivity']
    }
  ];

  return {
    issues: fallbackIssues,
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalIssues: 1,
      statusCounts: { new: 1, 'in-progress': 0, blocked: 0, resolved: 0 },
      priorityCounts: { high: 0, medium: 1, low: 0 }
    }
  };
};

/**
 * Gets the display color for issue priority
 */
export const getPriorityColor = (priority: TeamIssue['priority']): string => {
  switch (priority) {
    case 'high': return '#dc3545'; // Red
    case 'medium': return '#ffc107'; // Yellow/Orange
    case 'low': return '#28a745'; // Green
    default: return '#6c757d'; // Gray
  }
};

/**
 * Gets the display color for issue status
 */
export const getStatusColor = (status: TeamIssue['status']): string => {
  switch (status) {
    case 'new': return '#007bff'; // Blue
    case 'in-progress': return '#17a2b8'; // Teal
    case 'blocked': return '#dc3545'; // Red
    case 'resolved': return '#28a745'; // Green
    default: return '#6c757d'; // Gray
  }
};

/**
 * Formats status text for display
 */
export const formatStatusText = (status: TeamIssue['status']): string => {
  switch (status) {
    case 'new': return 'New';
    case 'in-progress': return 'In Progress';
    case 'blocked': return 'Blocked';
    case 'resolved': return 'Resolved';
    default: return status;
  }
};

/**
 * Gets relative time string for issue dates
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Gets initials from name for avatar display
 */
export const getInitials = (name: string | null): string => {
  if (!name) return '??';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};