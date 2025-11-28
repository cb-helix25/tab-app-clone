import React, { useCallback, useState } from 'react';
import { PrimaryButton, Stack, Text, TextField } from '@fluentui/react';
import { Deal, DocumentRecord, Enquiry, InstructionResponse, Payment, PitchContentRecord } from './types';

const cardStyles = {
  root: {
    border: '1px solid rgba(128,128,128,0.2)',
    borderRadius: 8,
    padding: 16,
    background: 'rgba(255,255,255,0.95)',
  },
};

const InstructionExplorer: React.FC = () => {
  const [instructionRef, setInstructionRef] = useState('');
  const [data, setData] = useState<InstructionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    return (
      <Stack tokens={{ childrenGap: 8 }} styles={cardStyles}>
        <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
          {title}
        </Text>
        {rows.length === 0 ? (
          <Text>No records</Text>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((key) => (
                  <th
                    key={key}
                    style={{
                      textAlign: 'left',
                      padding: '4px 8px',
                      borderBottom: '1px solid rgba(128,128,128,0.3)',
                    }}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((record, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((key) => (
                    <td
                      key={key}
                      style={{ padding: '4px 8px', borderBottom: '1px solid rgba(128,128,128,0.1)' }}
                    >
                      {String(record[key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Stack>
    );
  };

  const toRows = <T extends Record<string, unknown>>(record?: T) => (record ? [record] : undefined);

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xLarge">Instruction Explorer</Text>
      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <Stack.Item grow>
          <TextField
            label="Instruction Reference"
            value={instructionRef}
            onChange={(_, value) => setInstructionRef(value ?? '')}
            placeholder="e.g. INS-12345"
          />
        </Stack.Item>
        <PrimaryButton text="Load" onClick={loadInstruction} disabled={loading} />
      </Stack>
      {loading && <Text>Loading instruction…</Text>}
      {error && (
        <Text styles={{ root: { color: '#a80000' } }}>
          {error}
        </Text>
      )}
      {!loading && !error && !data && <Text>Enter an instruction reference to load details.</Text>}
      {data && (
        <Stack tokens={{ childrenGap: 16 }}>
          {renderList('Instructions', toRows(data.instruction))}
          {renderList<Deal>('Deals', toRows(data.deal))}
          {renderList<Enquiry>('Enquiries', toRows(data.enquiry))}
          {renderList<Payment>('Payments', data.payments)}
          {renderList<DocumentRecord>('Documents', data.documents)}
          {renderList<PitchContentRecord>('Pitch Content', data.pitchContent)}
        </Stack>
      )}
    </Stack>
  );
};

export default InstructionExplorer;