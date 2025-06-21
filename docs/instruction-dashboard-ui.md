# Instruction Dashboard UI Overview

This document outlines the new placeholders added to the instruction dashboard. The goal is to surface key actions a solicitor may take when progressing a new instruction. The dashboard now exposes additional quick actions and displays high level status information for each instruction.

## Quick Actions

A sticky action bar now appears at the top of the Instructions tab. It contains buttons for:

- **New Instruction** – start capturing a fresh instruction.
- **New Matter** – open a matter against the selected instruction.
- **EID Check** – placeholder for launching an electronic ID verification.
- **Risk Assessment** – placeholder for performing a matter risk review.
- **Draft CCL** – placeholder for generating a client care letter.

These actions use the shared `QuickActionsCard` component so the look and feel matches the rest of the application.

## Instruction Cards

Each instruction card now shows two additional fields when available:

- **ID Check** – current status of any electronic ID verification.
- **Risk** – latest risk assessment result.

This ensures solicitors can quickly see whether mandatory checks have been completed before opening a matter.

Three buttons now appear at the bottom of each card to launch these actions.
The order is **Risk Assessment**, **ID Check** and finally **Open Matter** so a
user is guided through the required steps.

All functionality is currently non-operational but the UI is ready to hook into future services.