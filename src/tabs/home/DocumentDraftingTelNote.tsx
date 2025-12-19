import React, { useCallback, useMemo, useState } from 'react';
import {
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  SpinButton,
  Stack,
  Text,
  TextField,
  useTheme as useFluentTheme,
} from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

const DocumentDraftingTelNote: React.FC = () => {
  const navigate = useNavigate();
  const theme = useFluentTheme();

  const [feeEarner, setFeeEarner] = useState('');
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState(0);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [callWith, setCallWith] = useState('');
  const [matterRef, setMatterRef] = useState('');

  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<
    | null
    | {
        emailSubject: string;
        emailBody: string;
        polishedNote: string;
        updatedNoteObject: unknown;
        draftedAt?: string;
      }
  >(null);

  const callWithOptions: IDropdownOption[] = useMemo(
    () => [
      { key: 'Opponent', text: 'Opponent' },
      { key: 'Client', text: 'Client' },
      { key: 'Court', text: 'Court' },
      { key: 'Barrister', text: 'Counsel' },
      { key: 'Third party', text: 'Third party' },
    ],
    [],
  );

  const noteObject = useMemo(
    () => ({
      Fe: feeEarner,
      Notes: notes,
      Units: units,
      Date: date,
      Time: time,
      CallWith: callWith,
      MatterRef: {
        Label: matterRef,
      },
    }),
    [callWith, date, feeEarner, matterRef, notes, time, units],
  );

  const promptText = useMemo(
    () =>
      [
        'Use this telephone attendance to draft a concise follow email regarding what was spoken about.',
        `Fee earner: ${feeEarner}`,
        `Matter reference: ${matterRef}`,
        `Call with: ${callWith}`,
        `Date/time: ${date} ${time}`,
        `Units: ${units} (6-minute units)`,
        'Narrative:',
        notes,
        '',
        'Return both a polished note and the updated structured object.',
        JSON.stringify(noteObject, null, 2),
      ].join('\n'),
    [callWith, date, feeEarner, matterRef, noteObject, notes, time, units],
  );

  const handleUnitsChange = useCallback((_event: React.SyntheticEvent<HTMLElement>, newValue?: string) => {
    const parsed = Number(newValue);
    setUnits(Number.isNaN(parsed) ? 0 : parsed);
  }, []);

  const handleIncrement = useCallback(
    (value?: string) => {
      const parsed = Number(value);
      setUnits(Number.isNaN(parsed) ? units + 1 : parsed + 1);
    },
    [units],
  );

  const handleDecrement = useCallback(
    (value?: string) => {
      const parsed = Number(value);
      setUnits(Number.isNaN(parsed) ? Math.max(0, units - 1) : Math.max(0, parsed - 1));
    },
    [units],
  );

  const handleGenerateDraft = useCallback(async () => {
    setIsDrafting(true);
    setDraftError(null);

    try {
      const response = await fetch('/api/ai/draft-tel-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteObject,
          promptText,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Draft request failed (${response.status}). ${bodyText}`);
      }

      const data = (await response.json()) as {
        emailSubject?: string;
        emailBody?: string;
        polishedNote?: string;
        updatedNoteObject?: unknown;
        draftedAt?: string;
      };

      setDraftResult({
        emailSubject: data.emailSubject || '',
        emailBody: data.emailBody || '',
        polishedNote: data.polishedNote || '',
        updatedNoteObject: data.updatedNoteObject,
        draftedAt: data.draftedAt,
      });
    } catch (error) {
      setDraftResult(null);
      setDraftError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDrafting(false);
    }
  }, [noteObject, promptText]);

  const cardStyles = useMemo(
    () => ({
      root: {
        padding: 16,
        borderRadius: 10,
        border: `1px solid ${theme.palette.neutralLight}`,
        background: theme.palette.white,
        boxShadow: theme.isInverted ? '0 8px 24px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.08)',
      },
    }),
    [theme.isInverted, theme.palette.neutralLight, theme.palette.white],
  );

  const codeStyles = useMemo(
    () => ({
      root: {
        background: theme.palette.neutralLighterAlt,
        borderRadius: 8,
        padding: 12,
        fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace',
        fontSize: 12,
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-word' as const,
        border: `1px solid ${theme.palette.neutralLight}`,
      },
    }),
    [theme.palette.neutralLight, theme.palette.neutralLighterAlt],
  );

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <PrimaryButton text="Back to Home" onClick={() => navigate('/')} />
      <Text>
        Use the telephone attendance form to capture data intake, visualize the real-time object builder,
        and generate a drafted follow-up email using Foundry.
      </Text>

      <Stack horizontal wrap tokens={{ childrenGap: 20 }}>
        <Stack.Item grow styles={{ root: { minWidth: 320 } }}>
          <Stack tokens={{ childrenGap: 12 }} styles={cardStyles}>
            <Text variant="large">Data intake</Text>
            <TextField label="Fee earner" value={feeEarner} onChange={(_e, v) => setFeeEarner(v || '')} />
            <TextField label="Matter reference" value={matterRef} onChange={(_e, v) => setMatterRef(v || '')} />
            <Dropdown
              label="Call with"
              options={callWithOptions}
              selectedKey={callWith}
              onChange={(_event, option) => option && setCallWith(option.key.toString())}
            />
            <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
              <Stack.Item grow>
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(_e, v) => setDate(v || '')}
                  placeholder="YYYY-MM-DD"
                />
              </Stack.Item>
              <Stack.Item grow>
                <TextField
                  label="Time"
                  type="time"
                  value={time}
                  onChange={(_e, v) => setTime(v || '')}
                  placeholder="HH:MM:SS"
                />
              </Stack.Item>
            </Stack>
            <SpinButton
              label="Units (6-minute)"
              min={0}
              step={1}
              value={units.toString()}
              onChange={handleUnitsChange}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
            <TextField
              label="Notes"
              multiline
              rows={6}
              value={notes}
              onChange={(_e, v) => setNotes(v || '')}
              placeholder="Capture the attendance narrative..."
            />
          </Stack>
        </Stack.Item>

        <Stack.Item grow styles={{ root: { minWidth: 320 } }}>
          <Stack tokens={{ childrenGap: 12 }}>
            <Stack styles={cardStyles} tokens={{ childrenGap: 8 }}>
              <Text variant="large">Realtime object builder</Text>
              <Text variant="small">Review the structured object that updates with every change.</Text>
              <Text styles={codeStyles}>{JSON.stringify(noteObject, null, 2)}</Text>
            </Stack>

            <Stack styles={cardStyles} tokens={{ childrenGap: 8 }}>
              <Text variant="large">Drafting output (Foundry)</Text>
              <Text variant="small">
                Generates a follow-up email using the structured object + prompt.
              </Text>
              <PrimaryButton
                text={isDrafting ? 'Generating…' : 'Generate draft email'}
                onClick={handleGenerateDraft}
                disabled={isDrafting}
              />
              {draftError ? <Text styles={{ root: { color: theme.palette.redDark } }}>{draftError}</Text> : null}
              {draftResult ? (
                <Stack tokens={{ childrenGap: 10 }}>
                  <TextField label="Email subject" value={draftResult.emailSubject} readOnly />
                  <TextField label="Email body" multiline rows={10} value={draftResult.emailBody} readOnly />
                  <TextField
                    label="Polished note"
                    multiline
                    rows={6}
                    value={draftResult.polishedNote}
                    readOnly
                  />
                  <Stack tokens={{ childrenGap: 6 }}>
                    <Text variant="small">Updated structured object</Text>
                    <Text styles={codeStyles}>
                      {JSON.stringify(draftResult.updatedNoteObject ?? noteObject, null, 2)}
                    </Text>
                  </Stack>
                  {draftResult.draftedAt ? (
                    <Text variant="small">Drafted at: {draftResult.draftedAt}</Text>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Stack>
        </Stack.Item>
      </Stack>
    </Stack>
  );
};

export default DocumentDraftingTelNote;