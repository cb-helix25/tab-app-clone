# Grouped Enquiry Cards Implementation

## Overview
This implementation adds support for displaying repeated enquiries from the same client as grouped cards. When a client (identified by email or name) has multiple enquiries, they are combined into a single expandable card.

## Features

### 1. Grouped Enquiry Card
- **Visual Design**: Distinguished with a blue highlight border and badge showing the number of enquiries
- **Client Information**: Shows client name, email, and all areas of work involved
- **Combined Data**: Displays total value across all enquiries and latest enquiry date
- **Expandable**: Click to expand and see all individual enquiries for that client
- **Actions**: Call, email, and expand/collapse actions available

### 2. Smart Grouping
- **Client Identification**: Groups by email address (primary) with fallback to name matching
- **Automatic Detection**: Automatically detects repeated clients based on `Email`, `First_Name`, and `Last_Name` fields
- **Mixed Display**: Single enquiries display as normal cards, repeated enquiries display as grouped cards
- **Date Sorting**: Groups sorted by most recent enquiry date

### 3. Toggle View
- **Group Toggle Button**: Added to the EnquiriesMenu with tooltip
- **Icon Indicators**: Uses 'GroupedDescending' icon for grouped view, 'SingleBookmark' for list view
- **User Preference**: Toggle between grouped view and traditional list view

## Files Created/Modified

### New Files:
1. **`GroupedEnquiryCard.tsx`** - Main component for displaying grouped enquiries
2. **`enquiryGrouping.ts`** - Utility functions for grouping logic

### Modified Files:
1. **`Enquiries.tsx`** - Main component updated to support grouped display
2. **`EnquiriesMenu.tsx`** - Added toggle button for grouped view

## How It Works

### Grouping Logic:
```typescript
// Groups enquiries by client email/name
const groupedEnquiries = groupEnquiriesByClient(enquiries);

// Separates single vs. repeated enquiries
const mixedDisplay = getMixedEnquiryDisplay(enquiries);
```

### Client Identification:
- Primary: Email address (case-insensitive)
- Fallback: First name + Last name combination
- Groups maintain chronological order (newest first)

### Visual Hierarchy:
1. **Regular Enquiry**: Standard card with left border color based on area
2. **Grouped Enquiry**: Blue highlighted border, count badge, expandable content
3. **Expanded View**: Shows all individual enquiries for the client

## Example Use Cases

### Scenario 1: Luke Phillips - Multiple Enquiries
```
Client: Luke Phillips (phillips.luke71@gmail.com)
Enquiries: 2 enquiries on different dates
Display: Single grouped card with count badge "2"
Areas: Shows all areas involved (e.g., "other/unsure")
Actions: Click to expand and see both enquiries individually
```

### Scenario 2: Single Enquiry
```
Client: John Doe (john@example.com)
Enquiries: 1 enquiry
Display: Regular enquiry card (no grouping)
```

## Benefits

1. **Reduced Visual Clutter**: Multiple enquiries from same client don't crowd the list
2. **Quick Client Recognition**: Easily identify returning clients
3. **Comprehensive View**: See total client value and engagement history
4. **Flexible Display**: Toggle between grouped and list view as needed
5. **Maintains Functionality**: All existing actions (call, email, rate) still available

## Technical Implementation

### State Management:
- Added `showGroupedView` state to control display mode
- Preserved existing filtering and search functionality
- Maintained infinite scroll behavior

### Performance:
- Grouping logic runs in `useMemo` for optimization
- Maintains existing virtual scrolling for large datasets
- Type-safe implementation with TypeScript

### Accessibility:
- Proper ARIA labels and tooltips
- Keyboard navigation support
- Screen reader friendly structure
