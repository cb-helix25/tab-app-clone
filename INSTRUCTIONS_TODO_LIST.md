# Instructions System - Bug Fixes & Improvements TODO

**Last Updated:** September 11, 2025  
**Reference Record:** HLX-27706-88848 (Stacy Maphula)

## High Priority Bugs

### 1. Data Consistency Issues
- [ ] **Missing Related Data Handling**: Components expect IDVerifications, Payments, and Deals data that may not exist
  - **Impact**: UI components may crash or display incorrect status
  - **Location**: Instructions.tsx, InstructionCard.tsx
  - **Example**: Stacy's record has no IDVerifications/Payments/Deals entries

- [ ] **Client Name Resolution Logic**: Complex fallback logic could fail with incomplete data
  - **Impact**: Client names may not display correctly
  - **Location**: Instructions.tsx - client name resolution functions
  - **Risk**: Multiple nested conditions without proper null checks

### 2. Type Safety Issues
- [ ] **Remove `any` Types**: Multiple instances of `any` type usage reduce error detection
  - **Location**: Instructions.tsx (several state variables)
  - **Action**: Replace with proper TypeScript interfaces
  - **Benefit**: Better compile-time error detection

- [ ] **Strengthen Data Interfaces**: Add proper typing for API responses
  - **Impact**: Runtime errors from unexpected data structures
  - **Priority**: High - affects reliability

### 3. State Management Problems
- [ ] **useEffect Dependency Arrays**: Complex dependency chains risk infinite re-renders
  - **Location**: Instructions.tsx - multiple useEffect hooks
  - **Symptoms**: Performance issues, excessive API calls
  - **Solution**: Optimize dependencies and add useCallback/useMemo

- [ ] **State Update Race Conditions**: Async state updates may conflict
  - **Impact**: Inconsistent UI state
  - **Location**: fetchUnifiedEnquiries and related functions

## Medium Priority Issues

### 4. UI/UX Improvements
- [ ] **Timeline Bubble Calculations**: May break with missing completion dates
  - **Location**: InstructionCard.tsx - timeline rendering logic
  - **Symptoms**: Timeline may not display correctly

- [ ] **Status Determination Logic**: Complex conditional logic produces inconsistent states
  - **Location**: InstructionCard.tsx - payment/ID verification status
  - **Impact**: Status indicators may be wrong or confusing

- [ ] **Theme Switching Issues**: Dark/light mode transitions could cause rendering problems
  - **Location**: Both components - theme context usage
  - **Solution**: Add proper theme transition handling

### 5. Error Handling Gaps
- [ ] **API Error Boundaries**: Limited error handling for failed API calls
  - **Impact**: Unhandled promise rejections crash UI
  - **Location**: All async operations in Instructions.tsx

- [ ] **Graceful Degradation**: Components should handle missing data gracefully
  - **Example**: When IDVerifications table is empty, show appropriate message
  - **Priority**: Medium - improves user experience

## Low Priority Enhancements

### 6. Code Quality
- [ ] **Reduce Nested Ternary Operations**: Hard to debug complex conditional rendering
  - **Location**: InstructionCard.tsx - status display logic
  - **Action**: Extract to helper functions

- [ ] **Extract Complex Logic**: Move business logic out of components
  - **Benefit**: Better testability and maintainability
  - **Examples**: Status calculations, data transformations

### 7. Performance Optimizations
- [ ] **Memoization**: Add React.memo and useMemo for expensive operations
  - **Target**: Large instruction lists, complex filtering
  - **Impact**: Reduce unnecessary re-renders

- [ ] **Virtualization**: Consider virtual scrolling for large instruction lists
  - **Condition**: If instruction count > 100
  - **Benefit**: Improved scroll performance

## Database Schema Considerations

### 8. Data Integrity
- [ ] **Foreign Key Constraints**: Ensure referential integrity between tables
  - **Tables**: Instructions, IDVerifications, Payments, Deals
  - **Issue**: Records may exist without proper relationships

- [ ] **Default Value Handling**: Ensure all nullable fields have proper defaults
  - **Impact**: Reduces null reference errors in UI

## Testing Requirements

### 9. Test Coverage
- [ ] **Unit Tests**: Add tests for critical business logic
  - **Priority**: Status calculation functions
  - **Tools**: Jest, React Testing Library

- [ ] **Integration Tests**: Test API integration points
  - **Focus**: Data fetching and error scenarios
  - **Example**: Test behavior when related data is missing

## Implementation Notes

**Current Database Connection:** `2b71d471-5b9d-494f-b21c-4756a69485a8`  
**Test Record:** HLX-27706-88848 (Stage: initialised, Status: pitch)  
**Missing Data:** No IDVerifications, Payments, or Deals for test record

## Next Steps
1. Prioritize High Priority bugs first
2. Use Stacy's record (HLX-27706-88848) for testing fixes
3. Implement proper error boundaries
4. Add comprehensive TypeScript typing
5. Optimize state management patterns

---
*Generated from code review of Instructions.tsx (3422 lines) and InstructionCard.tsx (1310 lines)*
