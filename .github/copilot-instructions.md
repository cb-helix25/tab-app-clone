# Copilot custom instructions for this workspace

<!-- User preference: keep answers strictly concise with no extra explanation or fluff. -->
<!-- Responses should be short, factual, and limited to the requested action or change. -->

## General guidelines
- TypeScript-first; no ny. Use unknown + narrow.
- Keep functions small, pure; avoid hidden I/O.
- Return typed results; never throw plain strings.
- All exported functions and complex types require JSDoc.
- Security: parameterised SQL; never log secrets; use DefaultAzureCredential + Key Vault for prod.
- Keep diffs focused; no unrelated refactors.

## UI/Design patterns
- Apply professional white/grey/blue gradient styling consistently across components
- Use inline styles with gradient backgrounds: `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`
- Professional buttons: rounded corners (6px-12px), gradient backgrounds, hover effects with translateY(-1px)
- Theme-aware colors: always check `isDarkMode` and use `colours.dark.*` / `colours.light.*`
- Professional shadows: `0 4px 6px rgba(0, 0, 0, 0.07)` for light, `0 4px 6px rgba(0, 0, 0, 0.3)` for dark

## Component improvements
- When user says "apply sub-module design" - look for existing professional styling patterns in workspace
- Remove verbose headers when requested - users prefer clean, compact interfaces
- Make date fields practical: quick period buttons (This Month, Last Month, etc.) before custom pickers
- Back buttons: use arrow (←) + text, hover effects with color change and translateX animation
- Compact controls: smaller padding, efficient spacing, move status info to edges

## Error handling
- Always check compilation errors after large replacements
- Use existing component variables (sortedTableData, modalVisible) instead of creating new ones
- Fix TypeScript spread operator issues by avoiding complex nested spreads
- When DatePicker styles fail, use simple object structure instead of spreadingstom instructions for this workspace

<!-- User preference: keep answers strictly concise with no extra explanation or fluff. -->
<!-- Responses should be short, factual, and limited to the requested action or change. -->

## General guidelines
- TypeScript-first; no ny. Use unknown + narrow.
- Keep functions small, pure; avoid hidden I/O.
- Return typed results; never throw plain strings.
- All exported functions and complex types require JSDoc.
- Security: parameterised SQL; never log secrets; use DefaultAzureCredential + Key Vault for prod.
- Keep diffs focused; no unrelated refactors.
