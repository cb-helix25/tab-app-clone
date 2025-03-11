import React from 'react';
import { colours } from '../../app/styles/colours';
import './HomePreview.css';

interface Enquiry {
  Touchpoint_Date: string;
  // ... other fields
}

interface Matter {
  'OpenDate': string;
  // ... other fields
}

interface WIP {
  date: string;
  // ... other fields
}

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
  // ... other fields
}

interface HomePreviewProps {
  enquiries: Enquiry[] | null;
  allMatters: Matter[] | null;
  wip: WIP[] | null;
  recoveredFees: RecoveredFee[] | null;
}

const HomePreview: React.FC<HomePreviewProps> = ({
  enquiries,
  allMatters,
  wip,
  recoveredFees,
}) => {
  // Helper function to format dates as DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate metrics and date ranges
  const enquiriesCount = enquiries?.length || 0;
  const enquiriesRange = enquiries?.length
    ? `${formatDate(enquiries.reduce((min, e) => new Date(e.Touchpoint_Date) < new Date(min.Touchpoint_Date) ? e : min, enquiries[0]).Touchpoint_Date)} - ${formatDate(enquiries.reduce((max, e) => new Date(e.Touchpoint_Date) > new Date(max.Touchpoint_Date) ? e : max, enquiries[0]).Touchpoint_Date)}`
    : 'N/A';

  const mattersCount = allMatters?.length || 0;
  const mattersRange = allMatters?.length
    ? `${formatDate(allMatters.reduce((min, m) => new Date(m['OpenDate']) < new Date(min['OpenDate']) ? m : min, allMatters[0])['OpenDate'])} - ${formatDate(allMatters.reduce((max, m) => new Date(m['OpenDate']) > new Date(max['OpenDate']) ? m : max, allMatters[0])['OpenDate'])}`
    : 'N/A';

  const wipCount = wip?.length || 0;
  const wipRange = wip?.length
    ? `${formatDate(wip.reduce((min, w) => new Date(w.date) < new Date(min.date) ? w : min, wip[0]).date)} - ${formatDate(wip.reduce((max, w) => new Date(w.date) > new Date(max.date) ? w : max, wip[0]).date)}`
    : 'N/A';

  const recoveredFeesTotal = recoveredFees?.reduce((sum, r) => sum + r.payment_allocated, 0) || 0;
  const recoveredFeesRange = recoveredFees?.length
    ? `${formatDate(recoveredFees.reduce((min, r) => new Date(r.payment_date) < new Date(min.payment_date) ? r : min, recoveredFees[0]).payment_date)} - ${formatDate(recoveredFees.reduce((max, r) => new Date(r.payment_date) > new Date(max.payment_date) ? r : max, recoveredFees[0]).payment_date)}`
    : 'N/A';

  return (
    <section className="home-preview-section" style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 20px' }}>Executive Summary</h2>
      <div
        className="metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          width: '100%',
        }}
      >
        <div className="metric-card" style={metricCardStyle}>
          <h3 style={metricTitleStyle}>Total Enquiries</h3>
          <p style={metricValueStyle}>{enquiriesCount.toLocaleString()}</p>
          <p style={metricRangeStyle}>{enquiriesRange}</p>
        </div>
        <div className="metric-card" style={metricCardStyle}>
          <h3 style={metricTitleStyle}>Total Matters</h3>
          <p style={metricValueStyle}>{mattersCount.toLocaleString()}</p>
          <p style={metricRangeStyle}>{mattersRange}</p>
        </div>
        <div className="metric-card" style={metricCardStyle}>
          <h3 style={metricTitleStyle}>WIP Entries</h3>
          <p style={metricValueStyle}>{wipCount.toLocaleString()}</p>
          <p style={metricRangeStyle}>{wipRange}</p>
        </div>
        <div className="metric-card" style={metricCardStyle}>
          <h3 style={metricTitleStyle}>Recovered Fees</h3>
          <p style={metricValueStyle}>£{recoveredFeesTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p style={metricRangeStyle}>{recoveredFeesRange}</p>
        </div>
      </div>
    </section>
  );
};

const metricCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '15px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  textAlign: 'center',
};

const metricTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: colours.grey,
  margin: '0 0 10px',
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#333',
  margin: '0 0 5px',
  fontWeight: 'bold',
};

const metricRangeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: colours.greyText,
  margin: 0,
};

export default HomePreview;