# Instruction Card Pill System Quick Reference

## Overview
The instruction cards use a pill-based status system where each pill represents a stage in the workflow. Pills are interactive and change behavior based on their status.

## Pill Types & Colors

| Pill | Purpose | Green | Yellow | Red | Blue |
|------|---------|-------|--------|-----|------|
| **Pitch** | Deal capture | Complete | - | - | Next Action |
| **ID** | Identity verification | Passed | Review | Failed | Next Action |
| **Risk** | Risk assessment | Low Risk | Medium Risk | High Risk | Next Action |
| **Payment** | Payment processing | Paid | Pending | Failed | Next Action |
| **Documents** | File uploads | Uploaded | - | Missing | Next Action |
| **Matter** | Matter creation | Created | - | - | Next Action |
| **CCL** | CCL submission | Submitted | - | - | Next Action |

## Click Behaviors

### Next Action Pills (Blue)
- **Behavior**: Clicking triggers the related action
- **Example**: Click blue "Payment" pill → Opens payment form
- **Code**: Calls `setActiveStep(step.key)`

### Completed Pills (Green/Yellow/Red)
- **Behavior**: Clicking shows detailed information below card
- **Example**: Click green "Risk" pill → Shows risk assessment details
- **Code**: Toggles detail state (e.g., `setShowRiskDetails(!showRiskDetails)`)

### ID Verification (Special Case)
- **Behavior**: Always opens verification popup regardless of status
- **Reason**: User requested to maintain original behavior
- **Code**: Calls `onEIDClick()` function

## Detail Sections

### Risk Assessment Details
- Risk level with color coding
- Risk score (X/21)
- Assessor name  
- Assessment date
- Risk factors (tags)

### Payment Details
- Amount with currency
- Payment status (succeeded/pending/failed)
- Internal status (completed/paid)
- Created dates
- Supports multiple payments

### Document Details  
- Clickable document list
- Filenames and upload dates
- Calls `onDocumentClick(doc)` to view files
- Hover effects and download icons

### Matter Details
- Matter ID
- Creation status
- Number of matters created

## Technical Implementation

### State Variables
```typescript
const [showRiskDetails, setShowRiskDetails] = useState(false);
const [showPaymentDetails, setShowPaymentDetails] = useState(false);
const [showDocumentDetails, setShowDocumentDetails] = useState(false);
const [showMatterDetails, setShowMatterDetails] = useState(false);
```

### Click Handler Logic
```typescript
if (step.key === 'id' && onEIDClick) {
  onEIDClick(); // Always popup for ID
} else if (step.key === nextActionStep) {
  setActiveStep(prev => prev === step.key ? '' : step.key); // Trigger action
} else if (step.key === 'risk') {
  setShowRiskDetails(prev => !prev); // Toggle details
}
// ... similar for other pills
```

### Styling
- **Icons**: FontAwesome icons for each detail section header
- **Animation**: `fadeIn 0.3s ease-out` for appearing details
- **Layout**: CSS Grid for responsive detail layouts
- **Colors**: Consistent with `colours.ts` theme system

## Files Involved

### Frontend
- `src/tabs/instructions/InstructionCard.tsx` - Main pill implementation
- `src/tabs/instructions/RiskComplianceCard.tsx` - Risk color logic
- `src/app/styles/colours.ts` - Color definitions

### Backend  
- `api/src/functions/insertDeal.ts` - Deal capture email notifications

## Testing Scenarios
1. **Next Action**: Blue pills should trigger actions when clicked
2. **Completed Status**: Green/yellow pills should show details when clicked  
3. **ID Special Case**: ID pill should always open popup
4. **Document Viewing**: Documents in details should be clickable
5. **Color Accuracy**: Risk assessments should show correct colors

## Common Issues
1. **Multiple State Updates**: Don't call both action trigger AND detail toggle
2. **Missing Icons**: Ensure FontAwesome icons are imported
3. **Animation Performance**: Use CSS transitions for better performance
4. **Data Availability**: Handle cases where detail data might be missing
