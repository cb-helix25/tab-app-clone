import React, { useCallback, useMemo, useState } from 'react';
import {
  IconButton,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  ChoiceGroup,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { Deal, DocumentRecord, Enquiry, InstructionResponse, Payment, PitchContentRecord } from './types';

const layoutStyles = {
  root: {
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
  },
};

const cardStyles = {
  root: {
    border: '1px solid rgba(128,128,128,0.12)',
    borderRadius: 12,
    padding: 20,
    background: 'rgba(255,255,255,0.98)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
  },
};

const InstructionExplorer: React.FC = () => {
  const [instructionRef, setInstructionRef] = useState('');
  const [data, setData] = useState<InstructionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<{ title: string; rows: Record<string, unknown>[] } | null>(
    null
  );


  const loadInstruction = useCallback(async () => {
    const trimmed = instructionRef.trim();
    if (!trimmed) {
      setError('Please enter an instruction reference.');
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      const response = await fetch(`/api/instructions/${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error('Unable to load instruction data');
      }
      const payload: InstructionResponse = await response.json();
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [instructionRef]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const tableData = useMemo(() => {
    if (!data) {
      return null;
    }

    const getValue = (source: Record<string, unknown> | undefined, key: string) => {
      if (!source) {
        return null;
      }

      const normalizeSnakeToCamel = (value: string) =>
        value
          .replace(/[_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
          .replace(/^(\w)/, (match) => match.toLowerCase());

      const candidates = [
        key,
        key.toLowerCase(),
        key.charAt(0).toLowerCase() + key.slice(1),
        normalizeSnakeToCamel(key),
        normalizeSnakeToCamel(key.toLowerCase()),
      ];

      for (const candidate of candidates) {
        if (source[candidate] !== undefined) {
          return source[candidate];
        }
      }

      return null;
    };

    const enquiryData = data.enquiry || {};
    const coreEnquiryData = data.coreEnquiry || {};
    const instructionData = data.instruction || {};
    const payments = data.payments || [];
    const pitchContent = data.pitchContent || [];

    return {
      enquiries: {
        Poc: getValue(enquiryData, 'Poc'),
        Aow: getValue(enquiryData, 'Aow'),
        Tow: getValue(enquiryData, 'Tow'),
        First: getValue(enquiryData, 'First'),
        Last: getValue(enquiryData, 'Last'),
        Email: getValue(enquiryData, 'Email'),
        Phone: getValue(enquiryData, 'Phone'),
        Notes: getValue(enquiryData, 'Notes'),
      },
      coreEnquiries: {
        Poc: getValue(coreEnquiryData, 'Point_of_Contact'),
        Aow: getValue(coreEnquiryData, 'Area_of_Work'),
        Tags: getValue(coreEnquiryData, 'Tags'),
        First: getValue(coreEnquiryData, 'First_Name'),
        Last: getValue(coreEnquiryData, 'Last_Name'),
        Email: getValue(coreEnquiryData, 'Email'),
        Phone: getValue(coreEnquiryData, 'Phone_Number'),
        Notes: getValue(coreEnquiryData, 'Initial_first_call_notes'),
      },
      instructions: {
        Stage: getValue(instructionData, 'Stage'),
        ClientType: getValue(instructionData, 'ClientType'),
      },
      payments: payments.map((payment) => ({
        Amount: getValue(payment as Record<string, unknown>, 'Amount'),
        Payment_status: getValue(payment as Record<string, unknown>, 'Payment_status'),
        Internal_status: getValue(payment as Record<string, unknown>, 'Internal_status'),
      })),
      pitchContent: pitchContent.map((record) => ({
        EmailBody: getValue(record as Record<string, unknown>, 'EmailBody'),
      })),
    };
  }, [data]);

  const renderTable = (rows: Record<string, unknown>[], columns: string[]) => (
    <div
      style={{
        border: '1px solid rgba(128,128,128,0.12)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ background: 'rgba(0,0,0,0.03)' }}>
          <tr>
            {columns.map((key) => (
              <th
                key={key}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  textTransform: 'capitalize',
                  fontWeight: 700,
                  color: '#323130',
                  borderBottom: '1px solid rgba(128,128,128,0.12)',
                }}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((record, rowIndex) => (
            <tr key={rowIndex} style={{ background: rowIndex % 2 ? 'rgba(0,0,0,0.01)' : 'white' }}>
              {columns.map((key) => (
                <td
                  key={key}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(128,128,128,0.08)',
                    color: '#323130',
                    lineHeight: 1.4,
                  }}
                >
                  {formatValue(record[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  const renderList = <T extends { [key: string]: unknown }>(title: string, records?: T[]) => {
    const rows = records && records.length > 0 ? records : [];
    const columns = rows.length
      ? Array.from(
          new Set(
            rows.reduce<string[]>((acc, record) => {
              acc.push(...Object.keys(record));
              return acc;
            }, [])
          )
        )
      : [];

    const handleExpand = () => {
      if (rows.length) {
        setExpandedSection({ title, rows: rows as Record<string, unknown>[] });
      }
    };

    return (
      <Stack tokens={{ childrenGap: 12 }} styles={cardStyles}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="large" styles={{ root: { fontWeight: 700 } }}>
            {title}
          </Text>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <span
              style={{
                background: 'rgba(0,120,212,0.1)',
                color: '#005a9e',
                borderRadius: 999,
                padding: '2px 10px',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </span>
            {rows.length > 0 && (
              <IconButton
                iconProps={{ iconName: 'FullScreen' }}
                title={`Expand ${title}`}
                ariaLabel={`Expand ${title}`}
                onClick={handleExpand}
              />
            )}
          </Stack>
        </Stack>
        {rows.length === 0 ? (
          <Text styles={{ root: { color: '#6b6b6b' } }}>No records</Text>
        ) : (
          <Stack tokens={{ childrenGap: 8 }}>
            {renderTable(rows as Record<string, unknown>[], columns)}
            <Text styles={{ root: { color: '#6b6b6b', fontSize: 12 } }}>
              Expand to view this table in a full-screen panel.
            </Text>
          </Stack>
        )}
      </Stack>
    );
  };

  const toRows = <T extends Record<string, unknown>>(record?: T) => (record ? [record] : undefined);

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={layoutStyles}>
      <Stack tokens={{ childrenGap: 8 }} styles={cardStyles}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 700 } }}>
          Instruction Explorer
        </Text>
        <Text styles={{ root: { color: '#605e5c' } }}>
          Quickly pull together the latest data linked to an instruction reference.
        </Text>
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end" wrap>
          <Stack.Item grow>
            <TextField
              label="Instruction Reference"
              value={instructionRef}
              onChange={(_, value) => setInstructionRef(value ?? '')}
              placeholder="e.g. INS-12345"
            />
          </Stack.Item>
          <PrimaryButton text={loading ? 'Loading…' : 'Load'} onClick={loadInstruction} disabled={loading} />
        </Stack>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error}
          </MessageBar>
        )}
        {!loading && !error && !data && (
          <Text styles={{ root: { color: '#6b6b6b' } }}>
            Enter an instruction reference and select <strong>Load</strong> to populate the panels below.
          </Text>
        )}
      </Stack>

      {loading && <Text>Loading instruction…</Text>}

      {data && (
        <Stack tokens={{ childrenGap: 16 }}>
          <Stack
            horizontal
            wrap
            tokens={{ childrenGap: 12 }}
            styles={{ root: { marginTop: -4 } }}
            disableShrink
          >
            {[{ label: 'Instruction Ref', value: data.instruction?.instructionRef },
              { label: 'Deal ID', value: data.deal?.dealId },
              { label: 'Enquiry ID', value: data.enquiry?.acid ?? data.enquiry?.id },
              { label: 'Stage', value: data.instruction?.stage ?? data.deal?.stage }]
              .filter((item): item is { label: string; value: unknown } => Boolean(item))
              .map(
              ({ label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,120,212,0.06)',
                    border: '1px solid rgba(0,120,212,0.14)',
                    minWidth: 140,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#605e5c', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 700, color: '#323130' }}>{formatValue(value)}</div>
                </div>
              )
            )}
          </Stack>

          <Stack tokens={{ childrenGap: 14 }}>
            {renderList('Instructions', toRows(data.instruction))}
            {renderList<Deal>('Deals', toRows(data.deal))}
            {renderList<Enquiry>('Enquiries', toRows(data.enquiry))}
            {renderList<Enquiry>('Helix Core Enquiries', toRows(data.coreEnquiry))}
            {renderList<Payment>('Payments', data.payments)}
            {renderList<DocumentRecord>('Documents', data.documents)}
            {renderList<PitchContentRecord>('Pitch Content', data.pitchContent)}
          </Stack>

          {tableData && (
            <Stack tokens={{ childrenGap: 8 }} styles={cardStyles}>
              <Text variant="large" styles={{ root: { fontWeight: 700 } }}>
                Table data
              </Text>
              <Text styles={{ root: { color: '#6b6b6b' } }}>
                Combined JSON extracted from the loaded tables.
              </Text>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 10,
                  overflowX: 'auto',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {JSON.stringify(tableData, null, 2)}
              </pre>
            </Stack>
          )}
        </Stack>
      )}

      <Panel
        isOpen={!!expandedSection}
        onDismiss={() => setExpandedSection(null)}
        type={PanelType.large}
        headerText={expandedSection ? expandedSection.title : undefined}
        closeButtonAriaLabel="Close"
      >
        {expandedSection && expandedSection.rows.length > 0 ? (
          <Stack tokens={{ childrenGap: 12 }}>
            <Text styles={{ root: { color: '#605e5c' } }}>
              Expanded view of the {expandedSection.title.toLowerCase()} table.
            </Text>
            {renderTable(
              expandedSection.rows,
              Array.from(
                new Set(
                  expandedSection.rows.reduce<string[]>((acc, record) => {
                    acc.push(...Object.keys(record));
                    return acc;
                  }, [])
                )
              )
            )}
          </Stack>
        ) : (
          <Text styles={{ root: { color: '#6b6b6b' } }}>No records available.</Text>
        )}
      </Panel>
    </Stack>
  );
};

export default InstructionExplorer;