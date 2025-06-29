# Instruction Card State Matrix

This table summarises how the dashboard renders each instruction card depending on deal and ID status. It reflects the latest UI rules.

| Scenario | Deal | ID | Pay | Docs | Notes |
|---------|------|----|-----|------|-------|
| **ID-only (no deal)** | pending | ✓ | disabled | disabled | Proof of ID received but no deal pitched yet |
| **Pre-deal** | pending | pending | pending | pending | Neither deal nor ID provided |
| **Deal closed, optional docs** | ✓ | ✓ | ✓ | `None` or ✓ | Payment and ID passed. Docs may be optional |
| **Deal closed, payment failed** | ✓ | ✓ | ✗ | ✓ | Deal finished but payment unsuccessful |
| **Deal closed, all good** | ✓ | ✓ | ✓ | ✓ | All checks complete. ID action label becomes **ID Verified** |
| **Deal closed, ID needs review** | ✓ | review | ✓ | ✓ | ID requires manual review. Action label becomes **Review ID** |

Additional rules:
- A new **Risk** step appears in the status row. It shows a ✓ when the assessment result is low risk and a warning icon when flagged.
- The **Open Matter** button is enabled only once the Deal is closed and ID, Payment and Documents are all complete.