# Fix: Homepage Enquiries Metrics Showing Zero

## Problem
Homepage metrics were showing 0 for:
- Enquiries Today
- Enquiries This Week
- Enquiries This Month
- Matters Opened This Month
- Conversion Rate

## Root Cause
The enquiries metrics calculation in `Home.tsx` was filtering enquiries by `Point_of_Contact` matching the current user's email/initials. For the LZ user, this was attempting to match against LZ's enquiries, but the requirement was to show **Alex Cook's (AC)** demo data instead.

## Solution
Implemented a two-part fix:

### 1. Fetch AC's Enquiries for LZ (`src/index.tsx`)
Modified three enquiries fetch locations to override email/initials when user is LZ:

```typescript
// Override for LZ: fetch Alex Cook's (AC) enquiries for demo purposes
const userInitials = userDataRes[0]?.Initials || "";
const isLZ = userInitials.toUpperCase() === "LZ";
const enquiriesEmail = isLZ ? "ac@helix-law.com" : (userDataRes[0]?.Email || "");
const enquiriesInitials = isLZ ? "AC" : userInitials;

fetchEnquiries(
  enquiriesEmail,
  dateFrom,
  dateTo,
  userDataRes[0]?.AOW || "",
  enquiriesInitials,
)
```

Applied to:
- Initial Teams context load (line 807)
- Local development load (line 877)
- User switching via `switchUser()` (line 761)

### 2. Match AC's POC for LZ (`src/tabs/home/Home.tsx`)
Updated the `matchesUser` function to check for Alex Cook's identifiers when user is LZ:

```typescript
const isLZ = (userInitials || '').toUpperCase() === 'LZ';

const matchesUser = (value: string | undefined | null) => {
  const normalised = (value || '').toLowerCase().trim();
  
  if (isLZ) {
    // For LZ, match against Alex Cook's identifiers since that's what we fetched
    const alexAliases = new Set<string>(['ac', 'alex cook', 'ac@helix-law.com']);
    return alexAliases.has(normalised);
  }
  
  // Otherwise match against current user's email or initials
  return normalised === currentUserEmail || normalised === userInitials.toLowerCase().trim();
};
```

## Testing
Verified that metrics now display correctly for:
- ✅ LZ user (shows AC's enquiries data)
- ✅ All other users (show their own enquiries data)
- ✅ User switching maintains correct data

## Files Modified
- `src/index.tsx` - Added LZ→AC override in 3 fetch locations
- `src/tabs/home/Home.tsx` - Updated matchesUser logic for LZ case

## Date
October 2, 2025
