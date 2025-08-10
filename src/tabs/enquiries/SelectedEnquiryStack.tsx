import React from 'react';
import { Enquiry } from '../../app/functionality/types';
import ClaimedEnquiryCard from './ClaimedEnquiryCard';
import { mergeStyles } from '@fluentui/react/lib/Styling';

interface Props {
  enquiries: (Enquiry & { __sourceType?: 'new' | 'legacy' })[];
  claimerMap: Record<string, { Email?: string; Initials?: string; 'Full Name'?: string } | undefined>;
  onSelect: (enquiry: Enquiry, multi?: boolean) => void;
  onRate: (id: string) => void;
  onPitch?: (e: Enquiry) => void;
  onToggleSelect: (e: Enquiry) => void;
}

/**
 * SelectedEnquiryStack
 * Visual overlapping horizontal stack of selected enquiries (like bank notes) for multi-selection context.
 */
const SelectedEnquiryStack: React.FC<Props> = ({ enquiries, claimerMap, onSelect, onRate, onPitch, onToggleSelect }) => {
  if (!enquiries.length) return null;
  const container = mergeStyles({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
    padding: '8px 4px 28px',
    overflowX: 'auto',
  });
  return (
    <div className={container} aria-label="Selected enquiries stack">
      {enquiries.map((enq, idx) => (
        <div key={enq.ID} style={{ position: 'relative', marginLeft: idx === 0 ? 0 : -Math.min(140, 180 - idx * 12), zIndex: enquiries.length - idx, transition: 'margin .25s' }}>
          <ClaimedEnquiryCard
            enquiry={enq}
            claimer={claimerMap[(enq.Point_of_Contact || '').toLowerCase()]}
            onSelect={onSelect}
            onRate={onRate}
            onPitch={onPitch}
            selected={true}
            isPrimarySelected={idx === 0}
            onToggleSelect={onToggleSelect}
          />
        </div>
      ))}
    </div>
  );
};

export default SelectedEnquiryStack;
