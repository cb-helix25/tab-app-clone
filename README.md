# Helix Hub v1 - Teams App Clone
*Minimal UI-Only Demo - Legal Services Platform for Microsoft Teams*

## 🚀 Quick Start for UI Demo

**SETUP**: This is a trimmed-down clone for UI demonstration purposes only.  
**Configuration**: Uses local JSON fixtures via `REACT_APP_USE_LOCAL_DATA=true`.  
**Purpose**: Showcase Team Hub interface and home tab layout without live integrations.

### Current State - UI Demo Version (Oct 13, 2025)
- ✅ **UI-Only Mode**: Configured to use local JSON fixtures instead of live API calls
- ✅ **Minimal Footprint**: Removed backend services, Azure Functions, and database dependencies  
- ✅ **Core Interface**: Team Hub section and home tab layout preserved for demonstration
- ✅ **Sample Data**: Bundled JSON fixtures provide realistic UI interaction
- ✅ **Pill System**: Interactive status pills with expandable details (UI only)
- ✅ **Clean Structure**: Only essential files kept (public/, src/, config files)
- 📦 **Dependencies**: Optimized for frontend-only development and demonstration

### Clone Setup History

#### October 13, 2025 - UI Demo Clone Creation
- ✅ **Repository Clone** - Forked from main tab-app repository for demo purposes
- ✅ **Backend Removal** - Deleted server/, api/, database/ and other backend directories
- ✅ **Local Data Mode** - Configured `.env.local` with `REACT_APP_USE_LOCAL_DATA=true`
- ✅ **File Cleanup** - Removed deployment scripts, Azure configs, and development tools
- ✅ **Dependencies** - Reinstalled npm packages for frontend-only operation
- 📦 **Structure** - Minimal footprint: public/, src/, docs/, and essential config files

### Available Documentation
- **📖 [Documentation](docs/)** - Various guides and technical details preserved from original repository
- **⚠️ Note**: Documentation reflects the full system; this clone only includes the UI components

### 🆕 Recent Work Feed Feature

**Added October 13, 2025** - Git Commit History Integration

The demo now includes a "Recent Work Completed" feed that displays git commit history:

#### Features
- **Live Git Data**: Displays actual commit history from the repository
- **Real-time Updates**: Shows recent commits with author, timestamp, and change statistics
- **Rich Formatting**: Commit messages formatted with file change indicators
- **Responsive Design**: Adapts to different screen sizes with compact mode option
- **Error Handling**: Graceful fallback to mock data if git commands fail

#### Development Setup
To run with full git history functionality:

1. **Start the Express Server** (Terminal 1):
   ```bash
   npm run start:server
   ```

2. **Start the React App** (Terminal 2):
   ```bash
   npm start
   ```

The proxy configuration routes `/api/*` calls from the React app (port 3000) to the Express server (port 3001).

#### API Endpoints
- **Git History**: `GET /api/git/history?limit=10`
- **Health Check**: `GET /api/health`

#### Components Added
- **RecentWorkFeed**: Main component displaying commit history
- **gitHistoryService**: Service layer for API communication
- **Express Server**: Backend API serving git data
- **Proxy Configuration**: Development setup for API routing

### 🔧 Team Issues Board Feature

**Added October 14, 2025** - Lightweight Issues Tracking

The home tab now includes a team issues board for tracking blockers and work ownership:

#### Features
- **Kanban-style Board**: Four columns (New, In Progress, Blocked, Resolved)
- **Issue Management**: Track title, description, priority, assignee, and tags
- **Real-time Updates**: Refresh capability with visual feedback
- **Local Data Mode**: Uses `src/localData/localIssues.json` for demo data
- **API Integration**: Optional `/api/team-issues` endpoint for live data
- **Responsive Design**: Adapts to mobile and desktop layouts

#### Data Structure
Issues contain:
- **Basic Info**: ID, title, description, status, priority
- **Assignment**: Assignee, reporter with display names and initials
- **Metadata**: Created/updated timestamps, estimated hours, tags
- **Blocking**: Blocked reason for blocked issues

#### Usage
- **Local Mode**: Edit `src/localData/localIssues.json` to update demo issues
- **API Mode**: Set `REACT_APP_USE_LOCAL_DATA=false` and implement `/api/team-issues`
- **Hybrid**: Falls back to mock data if API endpoint is unavailable

#### API Endpoint
- **Team Issues**: `GET /api/team-issues` (returns full issues dataset with metadata)

#### Future Database Integration
In the future, the team issue board form will write directly to a database, which will update the board in real-time. The planned database schema is:

```sql
CREATE TABLE [dbo].[create_new_issue] (
    [id]                 UNIQUEIDENTIFIER CONSTRAINT [DF_create_new_issue_id] DEFAULT (newid()) PRIMARY KEY,
    [title]              TEXT             NULL,
    [description]        TEXT             NULL,
    [priority]           TEXT             NULL,
    [reporter]           NVARCHAR (5)     NULL,  
    [tags]               TEXT             NULL,
    [created_at]         DATETIME2 (0)    CONSTRAINT [DF_create_new_issue_created_at] DEFAULT (getdate()) NOT NULL
);
```

This will enable:
- **Persistent Storage**: Issues will be saved permanently to the database
- **Multi-user Support**: Team members can create and view issues across sessions
- **Real-time Updates**: Board will refresh automatically when new issues are added
- **Data Analytics**: Historical issue tracking and reporting capabilities

### UI Demo Features
The interface demonstrates:
- **Team Hub Section**: Main dashboard interface with sample data
- **Interactive Pills**: Status pills with expandable details (static demo)
- **Sample Instructions**: Mock client and deal data for UI testing
- **Responsive Design**: Teams-optimized layout and components

## Overview of the Teams Tab App Clone

This is a UI-only demonstration clone of the Helix Hub Teams app. It showcases the interface and user experience without requiring backend services or database connections.

### Demo Features (UI Only)
- **Interface Preview**: Team Hub section with realistic sample data
- **Component Showcase**: Interactive pills, status displays, and navigation
- **Layout Demonstration**: Teams-optimized responsive design
- **Sample Data**: JSON fixtures simulate real instruction and deal data
- **Static Interactions**: UI components respond without backend processing

**Note**: This clone uses local JSON fixtures instead of live data. No authentication, database connections, or Azure services are required.

## Get started with the UI Demo Clone

> **Prerequisites**
>
> To run this UI demo clone, you only need:
>
> - [Node.js](https://nodejs.org/), supported versions: 18, 20
> - A web browser (Chrome, Edge, Firefox, etc.)
> 
> **Not Required for this clone:**
> - Microsoft 365 account
> - Teams Toolkit
> - Azure subscriptions
> - Database connections

### Quick Start Steps

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Verify Configuration**: 
   The `.env.local` file should contain:
   ```env
   REACT_APP_USE_LOCAL_DATA=true
   ```

3. **Start the Demo**:
   ```bash
   npm start
   ```

4. **View in Browser**:
   Open http://localhost:3000 to see the UI demo

5. **Explore the Interface**:
   - Navigate through the Team Hub sections
   - Click on interactive pills to see expanded details
   - Review sample instruction and deal data
   - Test responsive design by resizing the browser

**Congratulations**! You are now running a UI demonstration of the Helix Hub interface with sample data.

## What's included in this clone

| Folder       | Contents                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `src`        | The source code for the frontend UI components. Implemented with React and Fluent UI Framework.                       |
| `public`     | Static assets and HTML templates for the React application.                                                           |
| `docs`       | Documentation from the original repository (some may not apply to this UI-only clone).                               |

**Removed from clone**: `api/`, `server/`, `appPackage/`, `infra/`, `.vscode/`, and other backend/deployment related folders.

### Configuration Files

| File                 | Contents                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `package.json`       | Project dependencies and scripts for the React application.                                                            |
| `tsconfig.json`      | TypeScript configuration for the frontend code.                                                                        |
| `config-overrides.js`| React build configuration overrides.                                                                                  |
| `.env.local`         | Environment configuration set to use local JSON fixtures (`REACT_APP_USE_LOCAL_DATA=true`).                          |
| `teamsapp.yml`       | Teams Toolkit configuration (preserved but not required for UI demo).                                                 |
| `teamsapp.local.yml` | Local Teams Toolkit overrides (preserved but not required for UI demo).                                               |

## Using this UI Demo Clone

This clone is designed for:

### Demonstration Purposes
- **UI Showcase**: Present the Team Hub interface to stakeholders
- **Design Review**: Evaluate layout, components, and user experience
- **Component Testing**: Test individual UI elements with sample data
- **Responsive Testing**: Check interface behavior across different screen sizes

### Development Reference
- **Component Structure**: Understand React component organization
- **Fluent UI Usage**: See how Microsoft's design system is implemented
- **State Management**: Review local data handling patterns
- **Layout Patterns**: Reference responsive design approaches

### Limitations
- **No Backend**: Database calls, authentication, and API endpoints are not functional
- **Static Data**: All information comes from JSON fixtures in the codebase
- **No Persistence**: Changes are not saved and reset on page refresh
- **Demo Only**: Not suitable for production use or real data processing

## Clone Architecture

This UI-only clone has a simplified architecture focused on demonstration:

### Data Flow (Demo Mode)
1. **React Application** loads at http://localhost:3000
2. **Local JSON Fixtures** provide sample data instead of API calls
3. **Component State** manages UI interactions without persistence
4. **Browser Storage** handles temporary session data only

### Key Differences from Full System
- **No Backend Services**: Express server, Azure Functions, and databases removed
- **Static Data**: JSON fixtures replace dynamic database queries
- **No Authentication**: Microsoft Graph and Azure AD integration disabled
- **Local Only**: No network calls to external services or APIs

### Environment Configuration
- **Demo Mode**: `REACT_APP_USE_LOCAL_DATA=true` (configured by default)
- **Sample Data**: Located in `src/` directory as JSON fixtures
- **No Secrets**: No API keys, connection strings, or credentials required

### File Structure
```
tab-app-clone/
├── public/           # Static assets
├── src/             # React components and JSON fixtures
├── docs/            # Documentation (reference only)
├── package.json     # Dependencies
├── .env.local       # Demo configuration
└── README.md        # This file
```



## Local Development (UI Demo)

Topology
- React dev server (http://localhost:3000) → Express API (http://localhost:8080) under `/api/*`.
- Unified routes: `/api/matters-unified` (direct MSSQL with TTL cache), `/api/instructions` (unified instructions).
- Fallbacks (only when Express is down or a route is missing):
  - TypeScript Azure Functions at http://localhost:7072 (folder `api`)
  - Decoupled Functions at http://localhost:7071 (folder `decoupled-functions`)

Start locally
- VS Code task: “Start Teams App Locally” (runs prerequisites → provision → deploy → start frontend/backend).
- Or run tasks individually:
  - “Start frontend” → `npm run dev-tab:teamsfx` (background)
  - “Watch backend” → watches `api` functions (background)
  - “Start backend” → `npm run dev:teamsfx` (Express) (background)

### Simple Setup
- **Single Command**: `npm start` starts the React development server
- **Port**: Application runs on http://localhost:3000
- **No Backend**: No need to start API servers or database connections
- **Hot Reload**: Changes to components automatically refresh the browser

### Development Flow
1. **Install Dependencies**: `npm install` (if not already done)
2. **Start Demo**: `npm start`
3. **Open Browser**: Navigate to http://localhost:3000
4. **Make Changes**: Edit files in `src/` to see live updates
5. **Test UI**: Interact with components using sample data

### Troubleshooting
- **Port in use**: If port 3000 is busy, the dev server will prompt to use another port
- **Build errors**: Run `npm install` to ensure all dependencies are installed
- **Missing data**: Sample data is embedded in the `src/` directory as JSON fixtures

## Running the Demo

### Quick Start
```bash
npm install    # Install dependencies
npm start      # Start the development server
```

### What You'll See
- **Team Hub Interface**: Main dashboard with sample data
- **Interactive Components**: Pills, status displays, and navigation elements
- **Sample Data**: Realistic instruction and deal information for demonstration
- **Responsive Design**: Layout optimized for various screen sizes

### Building for Production (Static)
```bash
npm run build  # Creates optimized build in 'build/' folder
```
The build folder can be served by any static web server for demonstration purposes.

## UI Components Demonstrated

This clone showcases the main interface components of the Helix Hub system:

### Team Hub Sections
- **Instructions Management**: Client instruction display and navigation
- **Interactive Pills**: Status indicators with expandable detail views
- **Dashboard Layout**: Responsive grid system with Teams-optimized styling
- **Navigation**: Tab-based interface with smooth transitions

### Sample Data Features
- **Mock Instructions**: Realistic client instruction data for demonstration
- **Status Pills**: Interactive status indicators showing different workflow states  
- **Responsive Design**: Interface adapts to different screen sizes and Teams layouts
- **Fluent UI Components**: Microsoft's design system components used throughout

### Technology Stack (UI Only)
- **React**: Frontend framework for component-based UI
- **TypeScript**: Type-safe JavaScript development
- **Fluent UI**: Microsoft's design system for Teams integration
- **Local Data**: JSON fixtures for realistic demo content

## Summary

This tab-app-clone repository provides a streamlined, UI-only demonstration of the Helix Hub Teams application. Perfect for:

- **Stakeholder Presentations**: Show interface and user flow without technical setup
- **Design Reviews**: Evaluate visual design and user experience
- **Component Testing**: Interact with UI elements using sample data
- **Reference Implementation**: Study React and Fluent UI patterns

The clone maintains the look and feel of the full system while removing all backend complexity, making it easy to run and demonstrate anywhere.

FURTHER EDITS:

The Home tab also includes a lightweight issues board so the team can log blockers and track ownership alongside other hub updates. By default it hydrates from `src/localData/localIssues.json`, showing columns for **New**, **In Progress**, **Blocked**, and **Resolved** work. Update the JSON dataset or connect the optional `/api/team-issues` endpoint to surface live data.
Vision - Seeded a local team issues dataset and loader service that can also fall back to a future /api/team-issues endpoint + Embedded the new board on the Home tab, surfaced the data through the optional Express server, and documented the workflow in the README for local users.
