# Local Instruction Scenarios

This document describes the sample instruction records bundled with the project.
They are used when running the application locally so developers can see how each
card state should behave before the real API integration is wired up.

## Scenario Overview

| Scenario | Deal | Proof of ID | Payment | Documents | Risk | Notes |
|---------|------|------------|---------|-----------|------|-------|
| **Pre-deal** | pending | pending | pending | pending | pending | Deal pitched but nothing else completed |
| **ID started** | pending | pending | pending | pending | pending | Proof of ID received but EID check not run |
| **Deal closed, optional docs** | closed | complete | complete | optional | complete | All mandatory checks complete. Docs optional but provided |
| **ID review, payment succeeded** | closed | review | complete | none | pending | EID flagged for manual review, payment processed |
| **ID review, payment failed** | closed | review | failed | none | pending | Payment failed and ID requires review |
| **Deal closed, all good** | closed | complete | complete | complete | complete | Everything complete – Open Matter becomes available |

Action buttons reflect these states. "Verify ID" changes to **Review ID** when
the EID result is not `Passed`. "Assess Risk" becomes **Risk Assessed** once the
risk assessment returns a low or approved result. The **Open Matter** button only
enables when the deal is closed, payment succeeded, documents uploaded, ID has
been verified with a passing EID result and the risk check is complete.