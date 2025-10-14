// server/index.js
// Express server to provide git commit history API for the Tab App demo

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to execute git commands
const execGitCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024, // 1MB buffer
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Git command error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Git command stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
};

// Parse git commit data
const parseGitLog = (gitOutput) => {
  if (!gitOutput || gitOutput.trim() === '') {
    console.log('No git output to parse');
    return [];
  }

  const commits = [];
  const lines = gitOutput.split('\n');
  console.log(`Parsing ${lines.length} lines of git output`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse the structured git log format
    // Format: hash|author|timestamp|message
    const parts = line.split('|');
    console.log(`Line ${i}: ${parts.length} parts - ${line}`);
    
    if (parts.length >= 4) {
      const [hash, author, timestamp, message] = parts;
      
      commits.push({
        hash: hash.trim(),
        author: author.trim(),
        timestamp: timestamp.trim(),
        message: message.trim(),
        insertions: 0, // Will be filled in later if possible
        deletions: 0,  // Will be filled in later if possible
        filesChanged: 1 // Default to 1 file changed
      });
    }
  }

  console.log(`Parsed ${commits.length} commits`);
  return commits;
};

// API endpoint to get git history
app.get('/api/git/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const maxLimit = 50; // Prevent excessive requests
    const actualLimit = Math.min(limit, maxLimit);

    console.log(`Fetching ${actualLimit} recent commits...`);

    // Use a simple git log command that should work on all systems
    const gitCommand = `git log --pretty=format:"%H|%an|%ad|%s" --date=iso --max-count=${actualLimit}`;
    console.log(`Executing git command: ${gitCommand}`);
    
    let gitOutput;
    try {
      gitOutput = await execGitCommand(gitCommand);
      console.log(`Git command successful, output length: ${gitOutput.length}`);
    } catch (error) {
      console.error('Git command failed:', error.message);
      throw error;
    }

    // Parse the git output
    const commits = parseGitLog(gitOutput);

    // For commits without stats, try to get file change information
    for (let commit of commits) {
      if (commit.filesChanged === 1 && commit.insertions === 0 && commit.deletions === 0) {
        try {
          const statsOutput = await execGitCommand(`git show --stat --format="" ${commit.hash}`);
          const statsLines = statsOutput.split('\n').filter(line => line.trim());
          
          if (statsLines.length > 0) {
            // Count files changed
            const fileLines = statsLines.filter(line => line.includes('|'));
            commit.filesChanged = Math.max(fileLines.length, 1);
            
            // Try to extract insertion/deletion info from summary line
            const summaryLine = statsLines[statsLines.length - 1];
            const insertMatch = summaryLine.match(/(\d+) insertion/);
            const deleteMatch = summaryLine.match(/(\d+) deletion/);
            
            if (insertMatch) commit.insertions = parseInt(insertMatch[1]);
            if (deleteMatch) commit.deletions = parseInt(deleteMatch[1]);
          }
        } catch (error) {
          console.warn(`Failed to get stats for commit ${commit.hash}:`, error.message);
        }
      }
    }

    // Get repository information
    let repoInfo = {};
    try {
      const repoUrl = await execGitCommand('git config --get remote.origin.url');
      const branchName = await execGitCommand('git branch --show-current');
      repoInfo = {
        url: repoUrl,
        branch: branchName
      };
    } catch (error) {
      console.warn('Failed to get repository info:', error.message);
      repoInfo = {
        url: 'local repository',
        branch: 'main'
      };
    }

    const response = {
      commits,
      totalCommits: commits.length,
      repository: repoInfo,
      lastUpdated: new Date().toISOString(),
      requestedLimit: actualLimit
    };

    console.log(`Successfully fetched ${commits.length} commits`);
    res.json(response);

  } catch (error) {
    console.error('Error fetching git history:', error);
    
    // Return mock data if git fails
    const mockCommits = [
      {
        hash: 'abc123def456',
        author: 'Developer <dev@example.com>',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        message: 'Add recent work feed component',
        insertions: 145,
        deletions: 12,
        filesChanged: 3
      },
      {
        hash: 'def456ghi789',
        author: 'Team Member <team@example.com>',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        message: 'Fix styling issues in dashboard',
        insertions: 67,
        deletions: 23,
        filesChanged: 2
      },
      {
        hash: 'ghi789jkl012',
        author: 'Designer <design@example.com>',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        message: 'Update UI components and theme colors',
        insertions: 89,
        deletions: 45,
        filesChanged: 7
      }
    ];

    console.log('Returning mock data due to git error');
    res.status(200).json({
      commits: mockCommits,
      totalCommits: mockCommits.length,
      repository: {
        url: 'mock repository',
        branch: 'main'
      },
      lastUpdated: new Date().toISOString(),
      requestedLimit: parseInt(req.query.limit) || 10,
      mockData: true,
      error: 'Git command failed, using mock data'
    });
  }
});

// Team issues endpoint
app.get('/api/team-issues', (req, res) => {
  try {
    // In a real implementation, this would fetch from a database or issue tracking system
    // For demo purposes, return the local JSON data
    const fs = require('fs');
    const path = require('path');
    
    const issuesPath = path.join(__dirname, '../src/localData/localIssues.json');
    
    if (fs.existsSync(issuesPath)) {
      const issuesData = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
      console.log(`Serving ${issuesData.issues.length} team issues`);
      res.json(issuesData);
    } else {
      console.warn('Local issues file not found, returning mock data');
      
      // Fallback mock data
      const mockData = {
        issues: [
          {
            id: 'MOCK-001',
            title: 'Sample issue from API',
            description: 'This is a mock issue served from the Express API',
            status: 'new',
            priority: 'medium',
            assignee: 'DEV',
            assigneeName: 'Developer',
            reporter: 'API',
            reporterName: 'API Server',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['api', 'mock'],
            estimatedHours: 2
          }
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalIssues: 1,
          statusCounts: { new: 1, 'in-progress': 0, blocked: 0, resolved: 0 },
          priorityCounts: { high: 0, medium: 1, low: 0 }
        }
      };
      
      res.json(mockData);
    }
  } catch (error) {
    console.error('Error serving team issues:', error);
    res.status(500).json({
      error: 'Failed to load team issues',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tab-app-git-server',
    endpoints: [
      '/api/git/history',
      '/api/team-issues',
      '/api/health'
    ]
  });
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Git history server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Git history API: http://localhost:${PORT}/api/git/history`);
});

module.exports = app;