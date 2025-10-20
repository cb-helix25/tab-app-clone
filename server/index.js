// server/index.js
// Express server to provide git commit history API for the Tab App demo

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const fetch = require('node-fetch'); // For server-side external API calls only

const app = express();

// Log key operations in server logs for backend debugging
console.log(`[SERVER-INIT] Starting server in ${process.env.NODE_ENV || 'development'} mode`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // Basic request logging as per Codex requirements

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

    // Log key operations in server logs for backend debugging
    console.log(`[GIT-HISTORY] Request received - limit: ${actualLimit}, client: ${req.ip}`);
    console.log(`[GIT-HISTORY] Fetching ${actualLimit} recent commits...`);

    // Use a simple git log command that should work on all systems
    const gitCommand = `git log --pretty=format:"%H|%an|%ad|%s" --date=iso --max-count=${actualLimit}`;
    console.log(`Executing git command: ${gitCommand}`);
    
    let gitOutput;
    try {
      gitOutput = await execGitCommand(gitCommand);
      console.log(`[GIT-HISTORY] Git command successful, output length: ${gitOutput.length}`);
    } catch (error) {
      console.error(`[GIT-HISTORY-ERROR] Git command failed:`, error.message);
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

    console.log(`[GIT-HISTORY] Successfully fetched ${commits.length} commits for client ${req.ip}`);
    res.json(response);

  } catch (error) {
    console.error(`[GIT-HISTORY-ERROR] Failed to fetch git history for client ${req.ip}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch git history',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Team issues endpoint
app.get('/api/team-issues', (req, res) => {
  try {
    // Log key operations in server logs for backend debugging
    console.log(`[TEAM-ISSUES] Request received from client: ${req.ip}`);
    
    // In a real implementation, this would fetch from a database or issue tracking system
    // For demo purposes, return the local JSON data using shared filesystem imports
    const issuesPath = path.join(__dirname, '../src/localData/localIssues.json');
    
    if (fs.existsSync(issuesPath)) {
      const issuesData = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
      console.log(`[TEAM-ISSUES] Serving ${issuesData.issues.length} team issues to client ${req.ip}`);
      res.json(issuesData);
    } else {
      console.error(`[TEAM-ISSUES-ERROR] Local issues file not found at: ${issuesPath}`);
      res.status(404).json({
        error: 'Issues file not found',
        message: 'Local issues data file does not exist',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`[TEAM-ISSUES-ERROR] Error serving team issues to client ${req.ip}:`, error.message);
    res.status(500).json({
      error: 'Failed to load team issues',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Log key operations in server logs for backend debugging
  console.log(`[HEALTH-CHECK] Health check requested by client: ${req.ip}`);
  
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tab-app-git-server',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/git/history',
      '/api/team-issues',
      '/api/health'
    ]
  };
  
  console.log(`[HEALTH-CHECK] Responding with status: ${healthData.status}`);
  res.json(healthData);
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  // const buildPath = path.join(process.cwd(), 'build');
  const buildPath = path.resolve(__dirname, '..', 'build');
  if (!fs.existsSync(buildPath)) {
    console.warn(`[STATIC] React build directory not found at ${buildPath}. Check deployment packaging.`);
  }
  console.log(`[STATIC] Serving static files from: ${buildPath}`);
  
  // Serve static assets including favicon.ico
  app.use(express.static(buildPath));
  
  // Handle React Router - send all non-API routes to index.html
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`[ERROR] Failed to serve index.html:`, err);
        res.status(500).send('Error loading application');
      }
    });
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

// Export the app without binding for reuse by multiple entrypoints
// The actual server binding is handled by app.js for Azure App Service compatibility
module.exports = app;