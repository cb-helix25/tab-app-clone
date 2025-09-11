# Instruction Card Design

This document describes the small card component used to display a single instruction in the Overview. The design reuses tokens from the main instructions app so the look and feel is consistent across projects.

## Layout

Each card shows the instruction reference as a heading followed by a bullet list of important details such as status, service description and client information. Cards appear in a vertical stack within a prospect section and animate into view using the same `dropIn` animation seen in other cards. New for this iteration is a coloured bar running down the left edge of every card to match the metric containers on the Home page. This accent provides a stronger visual anchor for the instruction reference at the top.

```
Prospect 123
┌───────────────────────────────────────┐
│ HLX-1-001                              │
│ Status: instruction                    │
│ Client: Alex Smith                     │
│ [Pitch] [ID] [Risk] [Payment] [Docs]   │
└───────────────────────────────────────┘
```

## Styling

The component relies on `componentTokens.card` exported from `src/app/styles/componentTokens.ts` which defines the base padding, border radius and hover shadow used across the instruction app. Additional animation rules are defined in `src/app/styles/InstructionCard.css`.

Important styles include:

- `padding: 20px` and `border-radius: 8px` for a neat card shape
- `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` with a stronger shadow on hover
- `dropIn` keyframes so each card fades and slides into place

By leveraging these tokens the instruction dashboard maintains a clean and high quality appearance that matches the existing design language.

## Status Pills System

**Updated September 2025**: The card now uses a pill-based status system instead of action tabs. Pills are displayed horizontally below the instruction details and show the status of different workflow stages.

### Pill Types:
1. **Instruction/Pitch Capture** - Shows deal/service capture status
2. **ID Verification** - Electronic ID check status  
3. **Risk Assessment** - Risk assessment completion and result
4. **Payment** - Payment status and amount
5. **Documents** - Document upload status
6. **Matter** - Matter creation status
7. **CCL** - CCL submission status

### Pill Interactions:
- **Active/Next Action Pills**: Clicking triggers the related action
- **Completed Pills**: Clicking shows detailed information below the card
- **ID Verification**: Always opens verification popup (maintains original behavior)

### Pill Colors:
- **Green**: Complete/Passed status
- **Yellow**: Review required/Pending status  
- **Red**: Failed/Missing status
- **Blue**: Next action required

### Expandable Details:
When clicking on completed status pills, detailed information appears below the card:

- **Risk Assessment**: Shows risk level, score, assessor, date, and risk factors
- **Payment**: Shows amount, payment status, internal status, and dates for all payments
- **Documents**: Shows clickable document list with filenames and upload dates
- **Matter**: Shows matter ID, creation status, and related information

All detail sections use consistent styling with:
- Fade-in animations
- Grid layouts for responsive design
- Color-coded status indicators
- Appropriate FontAwesome icons