# Teams Embed Crash Investigation & Fixes

## Problem
App crashes for some users in Teams embedded version, but works fine in browser.

## Root Causes Identified

### 1. localStorage Quota Exhaustion (HIGH PRIORITY) ⚠️
**Symptoms**: App crashes or fails to load in Teams
**Cause**: Teams has stricter localStorage limits (~5MB) compared to browsers (~10MB)

**Current Issues**:
- Extensive caching without quota checks
- 15-minute TTL accumulates data
- Multiple cache keys per user session
- No cleanup of expired entries

**Files Affected**:
- `src/index.tsx` - Main caching logic
- `src/tabs/instructions/Instructions.tsx` - sessionStorage caching
- `src/tabs/resources/Resources.tsx` - localStorage for favorites

**Fix**: 
✅ Created `src/utils/storageHelpers.ts` with:
- Quota management (80% warning threshold)
- Automatic cleanup of expired cache
- Safe fallback when storage fails
- Storage availability detection

**Action Required**:
Replace direct `localStorage.getItem()` / `setItem()` calls with:
```typescript
import { getCachedData, setCachedData } from './utils/storageHelpers';

// Instead of:
// localStorage.setItem(key, JSON.stringify(data));
// Use:
setCachedData(key, data);

// Instead of:
// const raw = localStorage.getItem(key);
// Use:
const data = getCachedData<YourType>(key);
```

---

### 2. alert() in Teams (MEDIUM PRIORITY) ⚠️
**Symptoms**: App freezes or crashes when errors occur
**Cause**: Teams doesn't handle `alert()` / `confirm()` / `prompt()` modals well

**File**: `src/index.tsx` line ~60
```typescript
// ❌ BAD - Can crash Teams
alert("An unexpected error occurred. Check the console for details.");

// ✅ GOOD - Use Teams-friendly notification
// Create a notification component or log silently
```

**Fix Options**:
1. Remove alert() entirely - log to console only
2. Use Fluent UI MessageBar component for in-app notifications
3. Use Teams notification API (microsoftTeams.tasks.submitTask)

**Recommended Immediate Fix**:
```typescript
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
  // Remove alert() - just log and continue
  // Optional: Show non-blocking notification banner
});
```

---

### 3. Memory Leaks from console.log (LOW PRIORITY)
**Symptoms**: Slowdown over time, especially for users who keep Teams open for days
**Cause**: Console.log statements accumulate in Teams DevTools memory

**Files**: Many files have debug logging

**Fix**: 
1. **Immediate**: Wrap console.log in development check:
```typescript
const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
if (isDev) console.log('Debug info');
```

2. **Long-term**: Use existing `cleanup-console-logs.ps1` script before production builds

---

### 4. Large Data Fetching on Mount (MEDIUM PRIORITY)
**Symptoms**: Initial load crashes or times out in Teams
**Cause**: Parallel fetching of multiple large datasets

**File**: `src/index.tsx` - `initializeTeamsAndFetchData()`

**Current Code**:
```typescript
const [enquiriesRes, mattersRes, teamDataRes] = await Promise.all([
  fetchEnquiries(...),
  fetchAllMatterSources(fullName),
  fetchTeamData(),
]);
```

**Issue**: If any of these are large or slow, Teams may timeout/crash

**Fix**: Add staggered loading with timeout protection:
```typescript
// Load critical data first
const userDataRes = await fetchUserData(objectId);
setUserData(userDataRes);
setLoading(false); // Show UI immediately

// Then load secondary data with timeout
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), ms)
);

try {
  const enquiriesRes = await Promise.race([
    fetchEnquiries(...),
    timeout(10000) // 10 second timeout
  ]);
  setEnquiries(enquiriesRes);
} catch (err) {
  console.warn('Enquiries load timeout - using cached data');
  // Continue with cached data or empty array
}
```

---

### 5. Missing Error Boundaries (MEDIUM PRIORITY)
**Symptoms**: Single component error crashes entire app
**Cause**: No React Error Boundaries to catch render errors

**Fix**: Add error boundary in App.tsx:
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap main app:
<ErrorBoundary>
  <App {...props} />
</ErrorBoundary>
```

---

## Priority Implementation Order

1. **IMMEDIATE** (Do First):
   - Remove alert() from unhandled rejection handler
   - Add storage quota checks (use storageHelpers.ts)

2. **HIGH PRIORITY** (Do Soon):
   - Replace all localStorage calls with safe helpers
   - Add staggered data loading with timeouts
   - Add Error Boundary component

3. **MEDIUM PRIORITY** (Do When Possible):
   - Reduce console.log usage in production
   - Optimize large data fetches
   - Add retry logic for failed fetches

4. **LOW PRIORITY** (Nice to Have):
   - Add Teams-specific analytics to track crash patterns
   - Implement progressive loading UI
   - Add service worker for offline support

---

## Testing Checklist

After implementing fixes, test in Teams:

- [ ] Fresh login (clear cache)
- [ ] User with large dataset (many matters/enquiries)
- [ ] Slow network connection
- [ ] Mobile Teams client (iOS/Android)
- [ ] Desktop Teams client (Windows/Mac)
- [ ] Long-running session (leave open for hours)
- [ ] Switch between tabs multiple times
- [ ] Network interruption during load

---

## Monitoring

Add Teams-specific telemetry:
```typescript
// Track storage usage
const { percentUsed } = getStorageUsage();
if (percentUsed > 80) {
  // Log to analytics service
  console.warn(`Storage usage: ${percentUsed.toFixed(1)}%`);
}

// Track load times
const loadStart = performance.now();
// ... load data ...
const loadTime = performance.now() - loadStart;
if (loadTime > 5000) {
  console.warn(`Slow load: ${loadTime}ms`);
}
```

---

## Related Files

- **Storage Helpers**: `src/utils/storageHelpers.ts` (NEW)
- **Main Entry**: `src/index.tsx`
- **App Component**: `src/app/App.tsx`
- **Instructions Tab**: `src/tabs/instructions/Instructions.tsx`
- **Resources Tab**: `src/tabs/resources/Resources.tsx`
