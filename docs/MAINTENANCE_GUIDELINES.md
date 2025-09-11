# Maintenance & Future Agent Guidelines

## System Health Indicators

### Critical Preservation Rules
1. **Never delete Luke Test**: `HLX-27367-94842` is the production health indicator
2. **Preserve pill behavior**: ID pills must always call `onEIDClick()` - never show details
3. **Risk color logic**: Must use `RiskAssessmentResult` field, NOT `TransactionRiskLevel`
4. **Email recipients**: Deal capture must go to both `lz@helix-law.com` AND `cb@helix-law.com`

### Key Architectural Principles
- **State over Actions**: Pills show status and provide interactions, not just buttons
- **Progressive Disclosure**: Details appear below cards when relevant pills are clicked
- **Context-Aware Clicks**: Next action pills trigger actions, completed pills show details
- **Data Integrity**: Always validate data exists before rendering detail sections

## Monitoring Points

### User Experience
- Risk assessments showing correct colors (green = low risk, yellow = medium, red = high)
- Pills responding correctly to clicks (actions vs details)
- Detail sections expanding smoothly with fadeIn animation
- Documents clickable and opening properly

### Data Flow
- Instructions loading via unified `/api/instructions` endpoint
- Deal capture emails reaching both primary recipients  
- Risk assessment data using correct field (`RiskAssessmentResult`)
- ID verification maintaining popup behavior

### Performance
- No N+1 query issues (single endpoint loads all data)
- Smooth animations without janky transitions
- Responsive pill layouts on different screen sizes
- Efficient state management (consider consolidating useState hooks)

## Common Pitfalls to Avoid

### Code Issues
1. **Double Actions**: Don't call both `onEIDClick()` AND toggle details for ID pills
2. **Wrong Risk Field**: Don't use `TransactionRiskLevel` for color determination
3. **Missing Imports**: Always import required FontAwesome icons
4. **State Conflicts**: Don't trigger actions AND show details simultaneously

### UX Issues  
1. **Unclear Interactions**: Pills should have clear visual feedback (hover states, cursors)
2. **Missing Data Handling**: Handle cases where detail data might be null/undefined
3. **Animation Conflicts**: Ensure smooth transitions without competing animations
4. **Accessibility**: Consider ARIA labels and keyboard navigation

## Quick Debugging

### Pill Not Clickable?
1. Check if pill key is included in click handler conditions
2. Verify cursor style is set to 'pointer'
3. Ensure hover effects are defined

### Details Not Showing?
1. Check if state variable exists and is toggled
2. Verify data exists before rendering details
3. Look for conditional rendering logic (`&&` operators)

### Wrong Colors?
1. Risk: Ensure using `RiskAssessmentResult` field
2. Status: Check pill status logic and color mapping
3. Theme: Verify `isDarkMode` context is working

### Email Not Sending?
1. Check both recipients are in `toRecipients` array
2. Verify email template includes both addresses
3. Test with actual deal capture process

## Documentation to Keep Updated

### When Adding New Pills
1. Update `docs/pill-system-quick-reference.md`
2. Update `docs/instruction-card-state-matrix.md`  
3. Update `docs/instruction-card-design.md`
4. Add to `RECENT_CHANGES_PILL_FUNCTIONALITY.md`

### When Changing Email Logic
1. Update `RECENT_CHANGES_PILL_FUNCTIONALITY.md`
2. Test with actual deal captures
3. Verify both recipients receive emails

### When Modifying State Logic
1. Check all pill interactions still work
2. Update quick reference documentation
3. Test edge cases (missing data, multiple clicks)

## Files That Need Regular Maintenance

### High-Change Probability
- `src/tabs/instructions/InstructionCard.tsx` - Main pill logic
- `api/src/functions/insertDeal.ts` - Email notifications
- `docs/pill-system-quick-reference.md` - Reference documentation

### Medium-Change Probability  
- `src/tabs/instructions/RiskComplianceCard.tsx` - Risk color logic
- `docs/instruction-card-design.md` - UI documentation
- `docs/instruction-card-state-matrix.md` - Status matrix

### Low-Change Probability
- `src/app/styles/colours.ts` - Color definitions
- `docs/AGENT_ONBOARDING_GUIDE.md` - Onboarding process
- `README.md` - Overview documentation

## Success Metrics
- ✅ Risk assessments show green for "Low Risk"
- ✅ ID pills open popups (no detail sections)
- ✅ Completed pills show expandable details
- ✅ Next action pills trigger appropriate actions
- ✅ Documents are clickable and viewable
- ✅ Deal emails reach both lz@ and cb@helix-law.com
- ✅ System performance remains smooth
