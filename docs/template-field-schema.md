# Template Field Schema - Helix House Style

## Overview
This document defines the schema for document template fields, mapping original descriptive field names to clean, brief Helix house-style placeholders suitable for database storage and UI display.

## Field Categories

### 1. Client Information
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `insert_clients_name` | `client_name` | string | Client's full name | "Mr. John Smith", "ABC Ltd" |

### 2. Matter Information  
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `insert_heading_eg_matter_description` | `matter_heading` | string | Matter description/heading | "Property Purchase - 123 Main St" |
| `matter` | `matter_type` | string | Type of legal matter | "Commercial Property Purchase", "Employment Dispute" |
| `insert_current_position_and_scope_of_retainer` | `scope_of_work` | text | Current position and scope | "Acting for purchaser in commercial property transaction" |

### 3. Handler Information
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `name_of_person_handling_matter` | `handler_name` | string | Name of matter handler | "John Williams", "Sarah Mitchell" |
| `status` | `handler_status` | string | Handler's professional status | "Senior Associate", "Partner" |
| `name_of_handler` | `handler_short_name` | string | Short reference name | "John", "Sarah" |
| `handler` | `handler_ref` | string | Handler reference for text | "John", "Sarah" |
| `email` | `contact_method` | string | Preferred contact method | "email", "telephone" |

### 4. Supervision & Support
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `name` | `supervisor_name` | string | Supervising partner name | "Michael Thompson" |
| `names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries` | `support_staff` | text | Other staff contact details | "Emily Roberts (020 1234 5678)" |
| `name_of_firm` | `firm_name` | string | Name of law firm | "Helix Law" |

### 5. Timeline & Process
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `next_steps` | `next_actions` | text | Next steps in matter | "Review and sign attached documents" |
| `realistic_timescale` | `timeline` | string | Expected completion time | "4-6 weeks", "3 months" |
| `next_stage` | `next_milestone` | string | Next major milestone | "Contract exchange", "Completion" |

### 6. Financial Information
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `figure` | `payment_amount` | decimal | Payment on account amount | "5000.00", "10000.00" |
| `figure_or_range` | `cost_estimate` | string | Cost estimate or range | "£15,000-£20,000", "£5,000" |
| `estimate` | `disbursement_estimate` | decimal | Disbursement estimate | "2500.00" |
| `we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible` | `no_estimate_reason` | text | Reason estimate not possible | "Matter complexity unknown at this stage" |
| `in_total_including_vat_or_for_the_next_steps_in_your_matter` | `estimate_scope` | string | Scope of estimate | "in total including VAT", "for next steps" |
| `give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees` | `estimate_includes` | text | What estimate includes | "accountant's report and court fees" |

### 7. Risk & Compliance
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `identify_the_other_party_eg_your_opponents` | `opposing_party` | string | Other party in matter | "ABC Corporation", "the seller" |
| `may_will` | `litigation_likelihood` | string | Likelihood of court proceedings | "may", "will" |

### 8. Business & Marketing
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `and_or_intervals_eg_every_three_months` | `cost_update_frequency` | string | Cost update intervals | "every three months", "monthly" |
| `contact_details_for_marketing_opt_out` | `marketing_contact` | string | Marketing opt-out contact | "hello@helixlaw.co.uk" |
| `link_to_preference_centre` | `preference_centre_url` | string | Marketing preference centre | "website preference centre" |

### 9. Legal & Referral
| Original Field | Helix Placeholder | Type | Description | Example Values |
|---|---|---|---|---|
| `explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement` | `referral_arrangement` | text | Referral arrangement details | "We have a fee-sharing arrangement with XYZ Brokers" |
| `instructions_link` | `cancellation_instructions_url` | string | Cancellation instructions link | "www.helixlaw.co.uk/cancellation" |

## Database Table Structure

```sql
CREATE TABLE template_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    field_category VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL, -- Helix placeholder name
    field_type ENUM('string', 'text', 'decimal', 'date', 'boolean') NOT NULL,
    field_value TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_template_id (template_id),
    INDEX idx_field_category (field_category),
    INDEX idx_field_name (field_name)
);

CREATE TABLE templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(255) NOT NULL,
    template_type ENUM('ccl', 'custom') NOT NULL,
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## TypeScript Interface

```typescript
interface TemplateField {
    id: number;
    templateId: number;
    fieldCategory: string;
    fieldName: string; // Helix placeholder name
    fieldType: 'string' | 'text' | 'decimal' | 'date' | 'boolean';
    fieldValue: string | null;
    isRequired: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

interface Template {
    id: number;
    templateName: string;
    templateType: 'ccl' | 'custom';
    templateContent: string;
    isActive: boolean;
    fields: TemplateField[];
    createdAt: Date;
    updatedAt: Date;
}

// Current implementation mapping
interface TemplateFieldMapping {
    [key: string]: string; // original -> helix placeholder
}

const FIELD_MAPPING: TemplateFieldMapping = {
    'insert_clients_name': 'client_name',
    'insert_heading_eg_matter_description': 'matter_heading',
    'matter': 'matter_type',
    'name_of_person_handling_matter': 'handler_name',
    'status': 'handler_status',
    'name_of_handler': 'handler_short_name',
    'handler': 'handler_ref',
    'email': 'contact_method',
    'insert_current_position_and_scope_of_retainer': 'scope_of_work',
    'next_steps': 'next_actions',
    'realistic_timescale': 'timeline',
    'name': 'supervisor_name',
    'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries': 'support_staff',
    'name_of_firm': 'firm_name',
    'next_stage': 'next_milestone',
    'figure': 'payment_amount',
    'figure_or_range': 'cost_estimate',
    'estimate': 'disbursement_estimate',
    'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible': 'no_estimate_reason',
    'in_total_including_vat_or_for_the_next_steps_in_your_matter': 'estimate_scope',
    'give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees': 'estimate_includes',
    'identify_the_other_party_eg_your_opponents': 'opposing_party',
    'may_will': 'litigation_likelihood',
    'and_or_intervals_eg_every_three_months': 'cost_update_frequency',
    'contact_details_for_marketing_opt_out': 'marketing_contact',
    'link_to_preference_centre': 'preference_centre_url',
    'explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement': 'referral_arrangement',
    'instructions_link': 'cancellation_instructions_url'
};
```

## Field Validation Rules

```typescript
const FIELD_VALIDATION: Record<string, {
    required: boolean;
    maxLength?: number;
    pattern?: RegExp;
    options?: string[];
}> = {
    'client_name': { required: true, maxLength: 255 },
    'matter_type': { required: true, maxLength: 255 },
    'handler_name': { required: true, maxLength: 255 },
    'handler_status': { 
        required: true, 
        options: ['Partner', 'Senior Partner', 'Associate', 'Senior Associate', 'Solicitor', 'Trainee', 'Consultant'] 
    },
    'contact_method': { 
        required: true, 
        options: ['email', 'telephone', 'post'] 
    },
    'payment_amount': { 
        required: false, 
        pattern: /^\d+(\.\d{2})?$/ 
    },
    'timeline': { required: true, maxLength: 100 },
    'next_actions': { required: true, maxLength: 1000 },
    'scope_of_work': { required: true, maxLength: 2000 }
};
```

## Migration Strategy

1. **Phase 1**: Update current `DocumentsV3.tsx` to use new field names
2. **Phase 2**: Create database tables and populate with existing data
3. **Phase 3**: Implement preset system with new field structure
4. **Phase 4**: Add validation and business logic

## Benefits of New Schema

- **Clarity**: Clear, concise field names that are easy to understand
- **Consistency**: Uniform naming convention across all templates
- **Scalability**: Easy to add new fields and templates
- **Maintainability**: Cleaner code and easier debugging
- **Database Optimization**: Better indexing and query performance
- **User Experience**: More intuitive field labels in UI
