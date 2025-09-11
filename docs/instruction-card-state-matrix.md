# Instruction Card State Matrix

This table summarises how the instruction dashboard renders each card using the pill-based status system. Use it alongside `local-instruction-scenarios.md` to understand which steps should be complete and what interactions are available.

**Updated September 2025**: The card now uses interactive status pills instead of action buttons.

| Scenario | Deal | ID | Pay | Docs | Risk | Matter | Notes |
|---------|------|----|-----|------|------|--------|-------|
| **Pre-deal** | pending | pending | pending | pending | pending | pending | Deal pitched but nothing completed |
| **ID started** | complete | pending | pending | pending | pending | pending | Proof of ID supplied but EID check pending |
| **Deal closed, optional docs** | complete | ✓ | ✓ | optional | ✓ | pending | Payment, ID and risk complete. Docs optional |
| **ID review, payment succeeded** | complete | review | ✓ | none | pending | pending | Payment processed, ID flagged for review |
| **ID review, payment failed** | complete | review | ✗ | none | pending | pending | Payment failed, ID requires review |
| **Deal closed, all good** | complete | ✓ | ✓ | ✓ | ✓ | pending | All checks complete – Matter creation available |
| **Matter created** | complete | ✓ | ✓ | ✓ | ✓ | ✓ | Full workflow complete |

## Pill Color Legend
- **Green (✓)**: Complete/Passed status
- **Yellow**: Review required/Pending status
- **Red (✗)**: Failed/Missing status
- **Blue**: Next action required (clickable to trigger action)
- **Gray**: Neutral/Optional status

## Pill Interactions
- **Next Action Pills** (blue): Click to trigger the related action
- **Completed Pills** (green/yellow): Click to view detailed information
- **ID Pill**: Always opens verification popup regardless of status
- **Failed Pills** (red): Click to retry or view error details

## Detail Expansion
Completed pills show expandable details when clicked:
- **Risk Assessment**: Risk level, score, assessor, date, factors
- **Payment**: Amount, status, internal status, dates (all payments)
- **Documents**: Clickable document list with upload dates
- **Matter**: Matter ID, creation status, count

The **Matter Creation** step only becomes available when the deal is closed, payment succeeded, documents received (if required), the EID result has **Passed** and the risk assessment is complete.
