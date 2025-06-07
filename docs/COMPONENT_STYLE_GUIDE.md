# Component Style Guide

This guide summarises common styling tokens extracted from existing forms and pages. It complements the colour palette defined in `src/app/styles/colours.ts` and can be imported anywhere in the project.

```ts
import { componentTokens } from '../styles/componentTokens';
```

## Tokens

### `stepHeader`
Defines the appearance of accordion headers used for multi‑step forms.

| Token            | Description                                   |
| ---------------- | --------------------------------------------- |
| `base`           | Default background, text colour and radius.   |
| `active`         | Colours when the step is expanded.            |
| `lockedOpacity`  | Opacity applied when a step is disabled.      |

### `stepContent`
Styling for the collapsible content panels beneath each step header.

| Token               | Description                                 |
| ------------------- | ------------------------------------------- |
| `borderColor`       | Default border colour around the content.   |
| `boxShadow`         | Shadow when the panel is open.              |
| `completedBorderColor` | Border colour used to highlight completion |

### `toggleButton`
Shared styling for choice buttons used in questions and options.

| Token    | Description                |
| -------- | -------------------------- |
| `base`   | Normal button appearance.  |
| `hover`  | Background on hover.       |
| `active` | Colours when selected.     |

### `summaryPane`
Container for the information summary shown on the right hand side or in mobile view.

| Token        | Description                                       |
| ------------ | ------------------------------------------------- |
| `base`       | Default box styling.                              |
| `collapsed`  | Styling when the summary is collapsed and marked complete. |

### `infoBanner`
Short highlighted banner used above form sections or questions.

### `accordion`
Base appearance for secondary accordions such as FAQ sections.

## Usage Example

```tsx
import { componentTokens } from '../styles/componentTokens';

const headerStyle = {
  background: componentTokens.stepHeader.base.backgroundColor,
  color: componentTokens.stepHeader.base.textColor,
  borderRadius: componentTokens.stepHeader.base.borderRadius,
};
```

These tokens are intended to be minimal and framework‑agnostic. They capture the visual language of the original instruction form so that the same look and feel can easily be reused in other parts of the application.
