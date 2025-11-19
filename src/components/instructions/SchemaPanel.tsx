import React from 'react';
import { Stack, Text } from '@fluentui/react';

interface TableDefinition {
  name: string;
  fields: string[];
}

const tables: TableDefinition[] = [
  {
    name: 'ENQUIRIES',
    fields: ['enquiryId (PK)', 'acid', 'prospectId'],
  },
  {
    name: 'DEALS (Pitches)',
    fields: ['dealId (PK)', 'enquiryId (FK → ENQUIRIES.enquiryId)', 'instructionRef (FK → INSTRUCTIONS.instructionRef)'],
  },
  {
    name: 'INSTRUCTIONS',
    fields: ['instructionRef (PK)', 'dealId (FK → DEALS.dealId)'],
  },
  {
    name: 'PAYMENTS',
    fields: ['paymentId (PK)', 'instructionRef (FK → INSTRUCTIONS.instructionRef)'],
  },
  {
    name: 'DOCUMENTS',
    fields: ['documentId (PK)', 'instructionRef (FK → INSTRUCTIONS.instructionRef)'],
  },
  {
    name: 'PITCH_CONTENT',
    fields: ['pitchContentId (PK)', 'acid (FK → ENQUIRIES.acid)'],
  },
];

const relationships: string[] = [
  'ENQUIRIES.enquiryId → DEALS.enquiryId',
  'ENQUIRIES.acid → PITCH_CONTENT.acid',
  'DEALS.instructionRef → INSTRUCTIONS.instructionRef',
  'INSTRUCTIONS.instructionRef → PAYMENTS.instructionRef',
  'INSTRUCTIONS.instructionRef → DOCUMENTS.instructionRef',
  'INSTRUCTIONS.dealId → DEALS.dealId',
];

const cardStyles = {
  root: {
    border: '1px solid rgba(128,128,128,0.25)',
    borderRadius: 8,
    padding: 16,
    background: 'rgba(255,255,255,0.9)',
  },
};

const SchemaPanel: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xLarge">Instructions Schema</Text>
      <Stack tokens={{ childrenGap: 12 }}>
        {tables.map((table) => (
          <Stack key={table.name} tokens={{ childrenGap: 8 }} styles={cardStyles}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              {table.name}
            </Text>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {table.fields.map((field) => (
                <li key={field}>
                  <Text>{field}</Text>
                </li>
              ))}
            </ul>
          </Stack>
        ))}
      </Stack>
      <Stack tokens={{ childrenGap: 8 }}>
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
          Key Relationships
        </Text>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {relationships.map((relationship) => (
            <li key={relationship}>
              <Text>{relationship}</Text>
            </li>
          ))}
        </ul>
      </Stack>
    </Stack>
  );
};

export default SchemaPanel;