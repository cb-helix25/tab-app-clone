# Instructions VNet Integration (Implemented)

## ✅ Current Implementation

The instructions app now successfully integrates with VNet-enabled Azure Functions for secure production database access.

### Architecture
```
React Frontend → Express Server → VNet Azure Function → Production Database
```

### Key Components
- **VNet Function**: `instructions-vnet-functions.azurewebsites.net/api/fetchInstructionData`
- **Authentication**: Function codes via environment variables or Key Vault
- **Database Access**: Azure SQL Database within Virtual Network
- **API Endpoint**: `/api/instructions` (unified endpoint)

### Authentication Flow
1. Express server gets function code from `INSTRUCTIONS_FUNC_CODE` or Key Vault
2. Calls VNet function with code parameter: `?code=<your-azure-function-key>`
3. VNet function validates code and queries database
4. Returns comprehensive instruction data with nested relationships

### Security Features
- ✅ Database only accessible from Virtual Network resources
- ✅ Function code authentication prevents unauthorized access  
- ✅ Production credentials stored securely in Key Vault
- ✅ No direct database access from development machines

## Legacy Requirements (May Be Outdated)

The following were original requirements for pitch builder integration. Verify if still needed:

### Prospect Link Format
The pitch builder generates prospect links using:
```
${process.env.REACT_APP_INSTRUCTIONS_URL}/pitch/<enquiryId>-<passcode>
```

### Required VNet Tasks (Status Unknown)
1. **Validate access tokens** - Route handler for `GET /pitch/:compound`
2. **Document & ID upload** - Prospect upload interface  
3. **Status tracking** - Completion status for back office
4. **Payments** - Disabled functionality (amount = 0)
5. **Error handling** - Graceful responses for invalid tokens

## Development Notes

- Focus on `/api/instructions` endpoint for instruction data access
- VNet integration working successfully for database operations
- Function codes may need periodic rotation when they expire
- Luke Test instruction (HLX-27367-94842) serves as integration health indicator

## Related Documentation
- `docs/UNIFIED_INSTRUCTIONS_ENDPOINT.md` - Detailed API documentation
- `ARCHITECTURE_ANALYSIS.md` - Architecture overview and benefits  
- `LOCAL_DEVELOPMENT_SETUP.md` - Environment configuration
