import React, { useState } from 'react';
import { colours } from '../../app/styles/colours';
import { WIP } from './ManagementDashboard';
import { Icon, Text, DefaultButton } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { useTheme } from '../../app/functionality/ThemeContext';
import { Enquiry, Matter } from '../../app/functionality/types';
import './HomePreview.css';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
}

interface HomePreviewProps {
  enquiries: Enquiry[] | null;
  allMatters: Matter[] | null;
  wip: WIP[] | null | undefined;
  recoveredFees: RecoveredFee[] | null;
}

const HomePreview: React.FC<HomePreviewProps> = ({ enquiries, allMatters, wip, recoveredFees }) => {
  const { isDarkMode } = useTheme();
  const [selectedRange, setSelectedRange] = useState<'today' | 'thisWeek' | 'thisMonth' | 'all'>('all');

  const parseAndFormatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
    let date: Date;
    if (parts.length === 3 && dateStr.includes('/')) {
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // DD/MM/YYYY -> YYYY-MM-DD
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount: number): string => {
    if (amount < 10000) {
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (amount < 1000000) {
      return `£${(amount / 1000).toFixed(1)}k`;
    } else if (amount < 1000000000) {
      return `£${(amount / 1000000).toFixed(2)}m`;
    } else {
      return `£${(amount / 1000000000).toFixed(2)}b`;
    }
  };

  const formatHours = (hours: number): string => {
    const whole = Math.floor(hours);
    const fraction = hours - whole;
    const minutes = Math.round(fraction * 60);
    return `${whole}h ${minutes}m`;
  };

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate: Date;

    switch (selectedRange) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }
    return { startDate, endDate: today };
  };

  const { startDate, endDate } = getDateRange();

  const filteredEnquiries = enquiries?.filter(e => {
    const date = new Date(e.Touchpoint_Date);
    return date >= startDate && date <= endDate;
  }) || [];
  const enquiriesCount = filteredEnquiries.length;
  const enquiriesRange = filteredEnquiries.length
    ? `${parseAndFormatDate(filteredEnquiries.reduce((min, e) => new Date(e.Touchpoint_Date) < new Date(min.Touchpoint_Date) ? e : min, filteredEnquiries[0]).Touchpoint_Date)} - ${parseAndFormatDate(filteredEnquiries.reduce((max, e) => new Date(e.Touchpoint_Date) > new Date(max.Touchpoint_Date) ? e : max, filteredEnquiries[0]).Touchpoint_Date)}`
    : 'N/A';

  const filteredMatters = allMatters?.filter(m => {
    const date = new Date((m as any)["Open Date"] || m.OpenDate);
    return date >= startDate && date <= endDate;
  }) || [];
  const mattersCount = filteredMatters.length;
  const mattersRange = filteredMatters.length
    ? `${parseAndFormatDate((filteredMatters.reduce((min, m) => new Date((m as any)["Open Date"] || m.OpenDate) < new Date((min as any)["Open Date"] || min.OpenDate) ? m : min, filteredMatters[0]) as any)["Open Date"] || filteredMatters[0].OpenDate)} - ${parseAndFormatDate((filteredMatters.reduce((max, m) => new Date((m as any)["Open Date"] || m.OpenDate) > new Date((max as any)["Open Date"] || max.OpenDate) ? m : max, filteredMatters[0]) as any)["Open Date"] || filteredMatters[0].OpenDate)}`
    : 'N/A';

  const filteredWip = wip?.filter(w => {
    const date = new Date(w.created_at);
    return date >= startDate && date <= endDate;
  }) || [];
  const wipTotalPounds = filteredWip.reduce((sum, w) => sum + (w.total || 0), 0) || 0;
  const wipTotalHours = filteredWip.reduce((sum, w) => sum + (w.quantity_in_hours || 0), 0) || 0;
  const wipRange = filteredWip.length
    ? `${parseAndFormatDate(filteredWip.reduce((min, w) => new Date(w.created_at) < new Date(min.created_at) ? w : min, filteredWip[0]).created_at)} - ${parseAndFormatDate(filteredWip.reduce((max, w) => new Date(w.created_at) > new Date(max.created_at) ? w : max, filteredWip[0]).created_at)}`
    : 'N/A';

  const filteredRecoveredFees = recoveredFees?.filter(r => {
    const date = new Date(r.payment_date);
    return date >= startDate && date <= endDate;
  }) || [];
  const collectedTotal = filteredRecoveredFees.reduce((sum, r) => sum + r.payment_allocated, 0) || 0;
  const collectedRange = filteredRecoveredFees.length
    ? `${parseAndFormatDate(filteredRecoveredFees.reduce((min, r) => new Date(r.payment_date) < new Date(min.payment_date) ? r : min, filteredRecoveredFees[0]).payment_date)} - ${parseAndFormatDate(filteredRecoveredFees.reduce((max, r) => new Date(r.payment_date) > new Date(max.payment_date) ? r : max, filteredRecoveredFees[0]).payment_date)}`
    : 'N/A';

  const sectionStyle = mergeStyles({ backgroundColor: isDarkMode ? colours.dark.background : '#ffffff', borderRadius: '0', boxShadow: isDarkMode ? '0 4px 16px rgba(255, 255, 255, 0.1)' : '0 4px 16px rgba(0, 0, 0, 0.1)', padding: '20px', fontFamily: 'Raleway, sans-serif', marginBottom: '40px' });
  const headerStyle = mergeStyles({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' });
  const metricsGridStyle = mergeStyles({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', width: '100%' });
  const metricCardStyle = mergeStyles({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', minHeight: '100px' });
  const iconStyle = mergeStyles({ fontSize: '32px', color: colours.highlight, marginRight: '10px' });
  const contentStyle = mergeStyles({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' });

  const metricCards = [
    { icon: 'People', title: 'Total Enquiries', value: enquiriesCount.toLocaleString(), range: enquiriesRange },
    { icon: 'Folder', title: 'Total Matters', value: mattersCount.toLocaleString(), range: mattersRange },
    { icon: 'Clock', title: 'WIP (h)', value: formatHours(wipTotalHours), range: wipRange },
    { icon: 'Clock', title: 'WIP (£)', value: formatCurrency(wipTotalPounds), range: wipRange },
    { icon: 'Money', title: 'Collected', value: formatCurrency(collectedTotal), range: collectedRange },
  ];

  return (
    <section className={`home-preview-section ${sectionStyle}`}>
      <div className={headerStyle}>
        <h2 style={{ fontSize: '20px', color: '#333', margin: 0 }}>Key Insights</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton text="Today" onClick={() => setSelectedRange('today')} className={selectedRange === 'today' ? 'selected' : 'unselected'} />
          <DefaultButton text="This Week" onClick={() => setSelectedRange('thisWeek')} className={selectedRange === 'thisWeek' ? 'selected' : 'unselected'} />
          <DefaultButton text="This Month" onClick={() => setSelectedRange('thisMonth')} className={selectedRange === 'thisMonth' ? 'selected' : 'unselected'} />
          <DefaultButton text="All Time" onClick={() => setSelectedRange('all')} className={selectedRange === 'all' ? 'selected' : 'unselected'} />
        </div>
      </div>
      <div className={metricsGridStyle}>
        {metricCards.map((card) => (
          <div key={card.title} className={`metric-card ${metricCardStyle}`}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon iconName={card.icon} className={iconStyle} />
              <div className={contentStyle}>
                <Text variant="large" styles={{ root: { fontWeight: 600, color: '#333', fontFamily: 'Raleway, sans-serif' } }}>{card.title}</Text>
                <Text variant="xxLarge" styles={{ root: { fontWeight: 800, color: '#000', fontFamily: 'Raleway, sans-serif' } }}>{card.value}</Text>
                <Text variant="small" styles={{ root: { color: colours.greyText, fontFamily: 'Raleway, sans-serif' } }}>{card.range}</Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomePreview;