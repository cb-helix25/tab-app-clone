# Instruction Card State Matrix

This table summarises how the instruction dashboard renders each card. Use it
alongside `local-instruction-scenarios.md` to understand which steps should be
complete for the action buttons to become active.

| Scenario | Deal | ID | Pay | Docs | Risk | Notes |
|---------|------|----|-----|------|------|-------|
| **Pre-deal** | pending | pending | pending | pending | pending | Deal pitched but nothing completed |
| **ID started** | pending | pending | pending | pending | pending | Proof of ID supplied but EID check pending |
| **Deal closed, optional docs** | closed | ✓ | ✓ | optional | ✓ | Payment, ID and risk complete. Docs optional |
| **ID review, payment succeeded** | closed | review | ✓ | none | pending | Payment processed, ID flagged for review |
| **ID review, payment failed** | closed | review | ✗ | none | pending | Payment failed, ID requires review |
| **Deal closed, all good** | closed | ✓ | ✓ | ✓ | ✓ | All checks complete – Open Matter enabled |

The **Open Matter** button only becomes available when the deal is closed,
payment succeeded, documents received, the EID result has **Passed** and the
risk assessment is complete.
