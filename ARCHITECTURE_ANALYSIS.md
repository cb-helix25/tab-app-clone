# Instructions Tab Architecture Analysis

## Current "Patchy" Architecture Problems

### 1. Fragmented Data Fetching
- **Multiple fetchInstructionData implementations** across directories:
  - `instruct-pitch/decoupled-functions/fetchInstructionData/`
  - `decoupled-functions/fetchInstructionData/`
  - Legacy implementations
- **Individual SQL queries per instruction**:
  ```typescript
  // Current approach: 4-6 queries per instruction
  const instruction = await getInstruction(ref);
  const documents = await getDocuments(ref);
  const idVerifications = await getIDVerifications(ref);
  const riskAssessments = await getRiskAssessments(ref);
  const deals = await getDeals(ref);
  const jointClients = await getJointClients(ref);
  ```

### 2. Complex Client-Side Data Transformation
- Instructions.tsx performs heavy data processing at render time
- Multiple `useMemo` hooks transforming data:
  - `overviewItems` - Complex flattening and merging
  - `overviewItemsWithNextAction` - Computing business logic
  - `filteredOverviewItems` - Applying filters
- Data structure inconsistencies resolved during render

### 3. Performance Issues
- N+1 query problem (1 query + N queries for related data)
- Multiple database round trips per page load
- Large payload sizes due to repeated data
- Client-side filtering of large datasets

### 4. Inconsistent State Management
- Data scattered across multiple state variables
- Complex merging logic in `handleRiskAssessmentSave`
- Race conditions between different data sources

## Recommended Clean Architecture

### 1. Consolidated Data Fetching
```typescript
// Single comprehensive query with JOINs
async function fetchAllInstructionData(userInitials?: string): Promise<CleanInstructionData[]> {
  const query = `
    SELECT 
      i.*,
      d.*, 
      doc.*,
      ida.*,
      ra.*,
      jc.*,
      m.*
    FROM Instructions i
    LEFT JOIN Deals d ON d.InstructionRef = i.InstructionRef
    LEFT JOIN Documents doc ON doc.InstructionRef = i.InstructionRef
    LEFT JOIN IDVerifications ida ON ida.InstructionRef = i.InstructionRef
    LEFT JOIN RiskAssessment ra ON ra.InstructionRef = i.InstructionRef
    LEFT JOIN JointClients jc ON jc.DealId = d.DealId
    LEFT JOIN Matters m ON m.InstructionRef = i.InstructionRef
    WHERE i.AssignedTo = @userInitials OR @userInitials IS NULL
    ORDER BY i.DateOfEnquiry DESC
  `;
  
  const results = await executeQuery(query, { userInitials });
  return transformToCleanStructure(results);
}
```

### 2. Clean Data Structure
```typescript
interface CleanInstructionData {
  instruction: Instruction;
  deals: Deal[];
  documents: Document[];
  idVerifications: IDVerification[];
  riskAssessments: RiskAssessment[];
  jointClients: JointClient[];
  matters: Matter[];
  
  // Computed fields (server-side)
  nextAction: 'verify-id' | 'assess-risk' | 'open-matter' | 'draft-ccl' | 'complete';
  verificationStatus: 'pending' | 'received' | 'review' | 'complete';
  riskStatus: 'pending' | 'flagged' | 'complete';
  paymentStatus: 'pending' | 'complete';
  matterLinked: boolean;
}
```

### 3. Server-Side Business Logic
```typescript
function computeBusinessLogic(rawData: DatabaseRow[]): CleanInstructionData {
  // Move all business logic to server
  const verificationStatus = computeVerificationStatus(rawData);
  const riskStatus = computeRiskStatus(rawData);
  const nextAction = computeNextAction(verificationStatus, riskStatus, rawData);
  
  return {
    // ... structured data
    verificationStatus,
    riskStatus,
    nextAction,
    // ... other computed fields
  };
}
```

### 4. Simplified Frontend
```typescript
// Instructions.tsx becomes much simpler
const Instructions: React.FC<InstructionsProps> = ({ userInitials }) => {
  const [instructionData, setInstructionData] = useState<CleanInstructionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await fetchAllInstructionData(userInitials);
      setInstructionData(data);
      setLoading(false);
    }
    loadData();
  }, [userInitials]);

  // Simple client-side filtering - no complex transformations
  const filteredData = useMemo(() => 
    instructionData.filter(applyClientFilters), 
    [instructionData, filters]
  );

  if (loading) return <Spinner />;
  
  return (
    <div>
      {filteredData.map(item => (
        <InstructionCard key={item.instruction.InstructionRef} data={item} />
      ))}
    </div>
  );
};
```

## Implementation Plan

### Phase 1: Create Unified Data Service
1. Create `fetchInstructionDataUnified.ts` with comprehensive JOINs
2. Move business logic computation to server-side
3. Return clean, normalized data structure

### Phase 2: Simplify Frontend
1. Remove complex `useMemo` transformations
2. Eliminate duplicate state management
3. Use clean data directly in components

### Phase 3: Performance Optimization
1. Add caching layer
2. Implement incremental updates
3. Add loading states for better UX

## Expected Benefits
- **Consistency**: Single source of truth for data fetching
- **Performance**: Fewer database queries, smaller payloads
- **Maintainability**: Business logic centralized on server
- **Reliability**: Eliminates race conditions and transformation errors
