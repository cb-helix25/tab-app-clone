# Template Field Mapping - DocumentsV3

## Overview
This document maps the original verbose template field names to clean, brief Helix house-style names used in the DocumentsV3 component.

## Field Mapping Reference

### Client & Matter Information
- `insert_clients_name` → **Client Name**
- `insert_heading_eg_matter_description` → **Matter Heading**
- `matter` → **Matter Type**
- `insert_current_position_and_scope_of_retainer` → **Scope of Work**

### Handler Information
- `name_of_person_handling_matter` → **Handler Name**
- `status` → **Handler Status**
- `name_of_handler` → **Handler Short Name**
- `handler` → **Handler Reference**
- `email` → **Contact Method**

### Timeline & Process
- `next_steps` → **Next Actions**
- `realistic_timescale` → **Timeline**
- `next_stage` → **Next Milestone**

### Financial Information
- `figure` → **Payment Amount**
- `figure_or_range` → **Cost Estimate**
- `estimate` → **Disbursement Estimate**
- `we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible` → **No Estimate Reason**

### Support & Supervision
- `name` → **Supervisor Name**
- `names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries` → **Support Staff**
- `name_of_firm` → **Firm Name**

### Business & Compliance
- `and_or_intervals_eg_every_three_months` → **Cost Update Frequency**
- `contact_details_for_marketing_opt_out` → **Marketing Contact**
- `link_to_preference_centre` → **Preference Centre URL**
- `identify_the_other_party_eg_your_opponents` → **Opposing Party**
- `may_will` → **Litigation Likelihood**

### Legal & Referral
- `explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement` → **Referral Arrangement**
- `instructions_link` → **Cancellation Instructions URL**

## Usage in DocumentsV3

These field names are used in:
- **Template field state management**: `templateFields` state object
- **Preset system configuration**: `FIELD_PRESETS` constant with dropdown options
- **Hover tooltips for user guidance**: `FIELD_DISPLAY_NAMES` constant for clean field names
- **Field validation and display**: Input validation and UI rendering

### Hover Tooltip Implementation

When users hover over template field placeholders, a subtle tooltip appears showing the clean field name:

```typescript
// Field display names for hover tooltips
const FIELD_DISPLAY_NAMES = {
    insert_clients_name: "Client Name",
    matter: "Matter Type",
    // ... other mappings
};

// Hover handlers
const handleFieldHover = (fieldKey: string, event: React.MouseEvent) => {
    // Show tooltip with clean field name
};
```

### User Experience
- **Hover over any template field** → See clean field name in tooltip
- **Click on template field** → Open preset selection panel
- **Subtle visual feedback** → Helps users understand field purposes

## Implementation Notes

- All field names are stored in the `FIELD_DISPLAY_NAMES` constant
- Hover tooltips show the clean field name when hovering over template placeholders
- The preset system uses these names for better user experience
- Field validation is based on the original field keys but displays clean names
