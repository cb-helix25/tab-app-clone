# Interactive Template Editor Placeholders

This guide summarises placeholder syntax for the editor and downstream Docx/PDF generation.

## Basic Placeholders
- `{{client_name}}` — standard token replaced by user data.

## Labeled Placeholders
Use a label with a double colon to display helper text inside the editor while keeping the variable name for generation:

```
{{Email Address::client_email}}
```
In the editor this shows **Email Address:** before the placeholder value but only `client_email` is used when producing the Docx template.

## Conditional Blocks
Sections can be conditionally included using simple `if` blocks:

```
{{#if include_footer}}
Footer text here
{{/if}}
```

The editor renders these markers with subtle styling so authors can see where optional content begins and ends.