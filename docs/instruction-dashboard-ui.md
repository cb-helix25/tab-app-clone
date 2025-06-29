# Instruction Dashboard UI Overview

This document outlines the new placeholders added to the instruction dashboard. The goal is to surface key actions a solicitor may take when progressing a new instruction. The dashboard now exposes additional quick actions and displays high level status information for each instruction.

## Quick Actions

A sticky action bar now appears at the top of the Overview. It contains buttons for:

- **New Matter** – open a matter against the selected instruction.
- **EID Check** – placeholder for launching an electronic ID verification.
- **Risk Assessment** – placeholder for performing a matter risk review.
- **Draft CCL** – placeholder for generating a client care letter.

These actions use the shared `QuickActionsCard` component so the look and feel matches the rest of the application.

## Instruction Cards

Each instruction card displays a status row with individual icons for the main checks:

- **ID** – proof of identity provided.
- **Pay** – payment taken and confirmed.
- **Docs** – engagement documents uploaded.
- **Risk** – matter risk assessment.

The risk step shows a check mark when the assessment result is low risk and a warning icon when any rule is flagged.

Each item shows a check mark when complete, a cross on failure and a clock while pending. This ensures solicitors can quickly see whether mandatory checks have been completed before opening a matter.

Three action tabs now sit along the bottom edge of each card. Only the
selected tab expands to show its label while the others collapse down to
icons. They appear in the order **EID Check**, **Risk Assessment** and
finally **Open Matter** so a user is guided through each step in turn.

The **Open Matter** button only becomes active once the Deal is closed and the
ID, Payment and Documents steps all show a completed state.

The **Open Matter** tab now launches the matter opening workflow directly
from a card. Previously users had to use the navigator action to start a
new matter. The navigator still displays the workflow controls once
invoked, but the action is now accessible from each instruction card.

## Additional Clients Placeholder ID

Deals can include extra client contacts that do not yet exist in the CRM. These
clients are sent to the API with a `prospectId` of `-1`. The backend treats this
as a placeholder value until a real prospect record is created.

## Deals Without Instructions

The overview now also lists any deals that do not have an instruction reference.
When running locally the sample data contains at least one of these deals so
developers can see how they appear in the dashboard.