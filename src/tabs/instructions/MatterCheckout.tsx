import React, { useState } from 'react';
import { Stack, Text, PrimaryButton, TextField } from '@fluentui/react';
import StepHeader from '../StepHeader';
import StepOverview from '../StepOverview';
import TagButton from './TagButton';
import '../../app/styles/NewMatters.css';

const stepsOrder = ['identity', 'pay', 'upload'] as const;
type StepKey = typeof stepsOrder[number];

const stepTitles: Record<StepKey, string> = {
  identity: 'Prove Identity',
  pay: 'Pay',
  upload: 'Upload Files',
};

export default function MatterCheckout() {
  const [openStep, setOpenStep] = useState(0);
  const [idOption, setIdOption] = useState<'first' | 'renew'>('first');
  const [paid, setPaid] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const isStepComplete = (key: StepKey) => {
    switch (key) {
      case 'identity':
        return !!idOption;
      case 'pay':
        return paid;
      case 'upload':
        return files.length > 0;
      default:
        return false;
    }
  };

  const stepDetails: Record<StepKey, React.ReactNode> = {
    identity: <span>{idOption === 'renew' ? 'Renewing ID' : 'First-Time ID'}</span>,
    pay: <span>{paid ? 'Payment Complete' : 'Not Paid'}</span>,
    upload: <span>{files.length ? `${files.length} file(s)` : 'No files'}</span>,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const renderStepContent = (key: StepKey) => {
    switch (key) {
      case 'identity':
        return (
          <Stack tokens={{ childrenGap: 12 }} horizontalAlign="center">
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <TagButton label="First-Time ID" active={idOption === 'first'} onClick={() => setIdOption('first')} color="#4878d3" />
              <TagButton label="Renewing ID" active={idOption === 'renew'} onClick={() => setIdOption('renew')} color="#4878d3" />
            </Stack>
            <PrimaryButton text="Continue" onClick={() => setOpenStep(1)} />
          </Stack>
        );
      case 'pay':
        return (
          <Stack tokens={{ childrenGap: 12 }} horizontalAlign="center">
            <PrimaryButton text={paid ? 'Paid' : 'Pay Now'} onClick={() => { setPaid(true); setOpenStep(2); }} />
          </Stack>
        );
      case 'upload':
        return (
          <Stack tokens={{ childrenGap: 12 }} horizontalAlign="center">
            <input type="file" multiple onChange={handleFileChange} />
            <PrimaryButton text="Finish" onClick={() => setOpenStep(2)} />
          </Stack>
        );
      default:
        return null;
    }
  };

  const stepProgressSteps = stepsOrder.map((key) => ({ key, title: stepTitles[key] }));

  return (
    <Stack className="workflow-container">
      <div className="workflow-main">
        <div className="steps-column">
          {stepsOrder.map((key, idx) => (
            <div key={key} className={`step-section${openStep === idx ? ' active' : ''}`}>
              <StepHeader
                step={idx + 1}
                title={stepTitles[key]}
                complete={isStepComplete(key)}
                open={openStep === idx}
                onToggle={() => setOpenStep(openStep === idx ? -1 : idx)}
              />
              <div className="step-content">{openStep === idx && renderStepContent(key)}</div>
            </div>
          ))}
        </div>
        <StepOverview
          steps={stepProgressSteps}
          current={stepsOrder[openStep]}
          isStepComplete={isStepComplete}
          details={stepDetails}
          onStepClick={(key) => setOpenStep(stepsOrder.indexOf(key))}
        />
      </div>
    </Stack>
  );
}
