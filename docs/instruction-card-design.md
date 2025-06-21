# Instruction Card Design

This document describes the small card component used to display a single instruction in the Instructions tab. The design reuses tokens from the main instructions app so the look and feel is consistent across projects.

## Layout

Each card shows the instruction reference as a heading followed by a bullet list of important details such as status, service description and client information. Cards appear in a vertical stack within a prospect section and animate into view using the same `dropIn` animation seen in other cards.

```
Prospect 123
┌───────────────────────────────────────┐
│ HLX-1-001                              │
│ Status: instruction                    │
│ Client: Alex Smith                     │
└───────────────────────────────────────┘
```

## Styling

The component relies on `componentTokens.card` exported from `src/app/styles/componentTokens.ts` which defines the base padding, border radius and hover shadow used across the instruction app. Additional animation rules are defined in `src/app/styles/InstructionCard.css`.

Important styles include:

- `padding: 20px` and `border-radius: 8px` for a neat card shape
- `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` with a stronger shadow on hover
- `dropIn` keyframes so each card fades and slides into place

By leveraging these tokens the instruction dashboard maintains a clean and high quality appearance that matches the existing design language.

## Action Points

Below the details list the card includes an "Action Points" section. This lists
instruction‑specific tasks such as the electronic ID check status and the most
recent risk assessment result so solicitors can quickly see what work remains.
The action list sits beneath a divider at the bottom of the card.

Below the action list the card now displays three call to action buttons. These
allow a solicitor to launch the **Risk Assessment**, start the **Electronic ID
Check**, and finally **Open Matter** once the prerequisites are satisfied. The
buttons appear in that order so the required checks can be completed before the
matter is opened.