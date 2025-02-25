// src/tabs/matters/MatterOverview.tsx

import React, { useState } from 'react';
import {
  Stack,
  Text,
  Icon,
  mergeStyles,
  Separator,
  TooltipHost,
  Link,
  DefaultButton,
} from '@fluentui/react';
import { Matter, Transaction } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

// -----------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------

// Compute initials from a full name
const getInitials = (name: string): string => {
  if (!name.trim()) return '-';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

// Format date string using UK locale or return '-'
const formatDate = (dateStr: string | null): string => {
  if (!dateStr || !dateStr.trim()) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  } catch (err) {
    return '-';
  }
};

// Return raw value or '-'
const getValue = (value?: string): string => {
  return value && value.trim() ? value : '-';
};

// Map rating to style
const mapRatingToStyle = (rating: string | undefined) => {
  switch (rating) {
    case 'Good':
      return { color: colours.green, icon: 'LikeSolid', isBorder: false };
    case 'Neutral':
      return { color: colours.greyText, icon: 'Like', isBorder: false };
    case 'Poor':
      return { color: colours.red, icon: 'DislikeSolid', isBorder: false };
    default:
      return { color: colours.red, icon: 'StatusCircleQuestionMark', isBorder: true };
  }
};

const formatCurrency = (num: number): string => {
  if (Math.abs(num) >= 1000) {
    // Divide by 1000 and format without decimals (or with one decimal if needed)
    return `£${(num / 1000).toFixed(0)}k`;
  }
  return num.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
};

// Format hours (e.g. "12.34h")
const formatHours = (num: number): string => `${num.toFixed(2)}h`;

// -----------------------------------------------------------------
// FinancialSection Component
// -----------------------------------------------------------------

interface FinancialSectionProps {
  matterSpecificActivitiesData?: any;
  outstandingData?: any;
  overviewData?: any;
  isDarkMode: boolean;
}

const FinancialSection: React.FC<FinancialSectionProps> = ({
  matterSpecificActivitiesData,
  outstandingData,
  overviewData,
  isDarkMode,
}) => {
  const activities = matterSpecificActivitiesData?.data || [];

  // For Work in Progress, include only activities where billed is false.
  const wipActivities = activities.filter((a: any) => !a.billed);
  const wipBillableActivities = wipActivities.filter((a: any) => !a.non_billable);
  const wipNonBillableActivities = wipActivities.filter((a: any) => a.non_billable);

  // For non-billable entries, use non_billable_total if available.
  const wipBillableTotal = wipBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.total ?? 0),
    0
  );
  const wipBillableHours = wipBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.rounded_quantity_in_hours ?? 0),
    0
  );
  const wipNonBillableTotal = wipNonBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.total ?? a.non_billable_total ?? 0),
    0
  );
  const wipNonBillableHours = wipNonBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.rounded_quantity_in_hours ?? 0),
    0
  );

  // Overall totals from all activities (regardless of billed)
  const overallBillableActivities = activities.filter((a: any) => !a.non_billable);
  const overallNonBillableActivities = activities.filter((a: any) => a.non_billable);

  const overallBillableTotal = overallBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.total ?? 0),
    0
  );
  const overallBillableHours = overallBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.rounded_quantity_in_hours ?? 0),
    0
  );
  const overallNonBillableTotal = overallNonBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.total ?? a.non_billable_total ?? 0),
    0
  );
  const overallNonBillableHours = overallNonBillableActivities.reduce(
    (sum: number, a: any) => sum + (a.rounded_quantity_in_hours ?? 0),
    0
  );

  // Outstanding balance from outstandingData
  const outstandingBalance = outstandingData?.total_outstanding_balance || 0;

  // Client Funds (Matter): pick the Trust account balance from overviewData.account_balances
  const trustAccount = overviewData?.account_balances?.find((acc: any) => acc.type === 'Trust');
  const clientFunds = trustAccount ? trustAccount.balance : 0;

  // For the overall totals bar, define a lighter blue for non-billable.
  const nonBillableColor = '#a3c9f1';

  return (
    <>
      {/* Top row: Three horizontal blocks */}
      <div
        className={mergeStyles({
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        })}
      >
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { justifyContent: 'space-between' } }}>
          {/* Work in Progress Block */}
          <div className={mergeStyles({ flex: 1, borderRight: '1px solid #ccc', paddingRight: '10px' })}>
            <Text variant="large" styles={{ root: { color: colours.highlight } }}>Work in Progress</Text>
            <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: '10px' } }}>
              {/* Billable Column */}
              <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                <Text variant="small" styles={{ root: { color: colours.highlight } }}>Billable</Text>
                <Text variant="medium">{formatCurrency(wipBillableTotal)}</Text>
                <Text variant="small">Hours: {formatHours(wipBillableHours)}</Text>
              </Stack>
              {/* Non-Billable Column */}
              <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                <Text variant="small" styles={{ root: { color: colours.highlight } }}>Non-Billable</Text>
                <Text variant="medium">{formatCurrency(wipNonBillableTotal)}</Text>
                <Text variant="small">Hours: {formatHours(wipNonBillableHours)}</Text>
              </Stack>
            </Stack>
          </div>
          {/* Outstanding Balance Block */}
          <div className={mergeStyles({ flex: 1, borderRight: '1px solid #ccc', padding: '0 10px' })}>
            <Text variant="large" styles={{ root: { color: colours.highlight } }}>Outstanding Balance</Text>
            <Stack tokens={{ childrenGap: 4 }} styles={{ root: { marginTop: '10px' } }}>
              <Text variant="small" styles={{ root: { color: colours.highlight } }}>Balance</Text>
              <Text
                variant="medium"
                styles={{ root: { color: outstandingBalance !== 0 ? colours.cta : colours.highlight } }}
              >
                {formatCurrency(outstandingBalance)}
              </Text>
            </Stack>
          </div>
          {/* Client Funds (Matter) Block */}
          <div className={mergeStyles({ flex: 1, paddingLeft: '10px' })}>
            <Text variant="large" styles={{ root: { color: colours.highlight } }}>Client Funds (Matter)</Text>
            <Stack tokens={{ childrenGap: 4 }} styles={{ root: { marginTop: '10px' } }}>
              <Text variant="small" styles={{ root: { color: colours.highlight } }}>Funds</Text>
              <Text variant="medium">{formatCurrency(clientFunds)}</Text>
            </Stack>
          </div>
        </Stack>
      </div>

      {/* Overall Totals Bar (Extension of Financial Section, labeled "Time") */}
      <div
        className={mergeStyles({
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        })}
      >
        <Text variant="large" styles={{ root: { color: colours.highlight } }}>Time</Text>
        {/* Totals (above the bar) */}
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { justifyContent: 'space-between', marginTop: '10px' } }}>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>
            Billable: {formatCurrency(overallBillableTotal)} ({formatHours(overallBillableHours)})
          </Text>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>
            Non-Billable: {formatCurrency(overallNonBillableTotal)} ({formatHours(overallNonBillableHours)})
          </Text>
        </Stack>
        {/* Bar Scale */}
        <div
          className={mergeStyles({
            position: 'relative',
            height: '20px',
            width: '100%',
            backgroundColor: '#eee',
            borderRadius: '10px',
            marginTop: '10px',
          })}
        >
          {overallBillableTotal + overallNonBillableTotal > 0 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${(overallBillableTotal / (overallBillableTotal + overallNonBillableTotal)) * 100}%`,
                  backgroundColor: colours.highlight,
                  borderTopLeftRadius: '10px',
                  borderBottomLeftRadius: '10px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${(overallNonBillableTotal / (overallBillableTotal + overallNonBillableTotal)) * 100}%`,
                  backgroundColor: nonBillableColor,
                  borderTopRightRadius: '10px',
                  borderBottomRightRadius: '10px',
                }}
              />
            </>
          ) : (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: '#ccc',
                borderRadius: '10px',
              }}
            />
          )}
        </div>
        {/* Labels below the bar */}
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: '5px', justifyContent: 'space-between' } }}>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>Billable</Text>
          <Text variant="small" styles={{ root: { color: nonBillableColor } }}>Non-Billable</Text>
        </Stack>
      </div>
    </>
  );
};

// -----------------------------------------------------------------
// Compliance Components
// -----------------------------------------------------------------

// Define the shape of a compliance record
interface ComplianceRecord {
  "Compliance Date": string;
  "Compliance Expiry": string;
  "ACID": string;
  "Client ID": string;
  "Matter ID": string;
  "Check ID": string;
  "Check Result": string;
  "Risk Assessor": string;
  "Client Type": string;
  "Client Type_Value": number;
  "Destination Of Funds": string;
  "Destination Of Funds_Value": number;
  "Funds Type": string;
  "Funds Type_Value": number;
  "How Was Client Introduced": string;
  "How Was Client Introduced_Value": number;
  "Limitation": string;
  "Limitation_Value": number;
  "Source Of Funds": string;
  "Source Of Funds_Value": number;
  "Value Of Instruction": string;
  "Value Of Instruction_Value": number;
  "Risk Assessment Result": string;
  "Risk Score": number;
  "Risk Score Increment By": number | null;
  "Client Risk Factors Considered": boolean;
  "Transaction Risk Factors Considered": boolean;
  "Transaction Risk Level": string;
  "Firm-Wide AML Policy Considered": boolean;
  "Firm-Wide Sanctions Risk Considered": boolean;
  "PEP and Sanctions Check Result": string;
  "Address Verification Check Result": string;
}

// A simple timeline visualization showing progress from Compliance Date to Expiry.
const ComplianceTimeline: React.FC<{ startDate: string; expiryDate: string }> = ({ startDate, expiryDate }) => {
  const start = new Date(startDate);
  const end = new Date(expiryDate);
  const now = new Date();
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  let progress = elapsed / total;
  if (progress < 0) progress = 0;
  if (progress > 1) progress = 1;
  const progressPercent = (progress * 100).toFixed(0);
  return (
    <div style={{ marginBottom: '10px' }}>
      <Text variant="small">Compliance Timeline</Text>
      <div style={{ position: 'relative', height: '10px', backgroundColor: '#eee', borderRadius: '5px', marginTop: '5px' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: colours.highlight, borderRadius: '5px' }}></div>
      </div>
      <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { justifyContent: 'space-between', marginTop: '5px' } }}>
        <Text variant="xSmall">{formatDate(startDate)}</Text>
        <Text variant="xSmall">{formatDate(expiryDate)}</Text>
      </Stack>
    </div>
  );
};

// Renders all compliance details for one record.
const ComplianceDetails: React.FC<{ record: ComplianceRecord }> = ({ record }) => {
  const { isDarkMode } = useTheme();
  const containerStyle = mergeStyles({
    border: `1px solid ${colours.grey}`,
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
  });

  return (
    <div className={containerStyle}>
      {/* Timeline Section */}
      <ComplianceTimeline startDate={record["Compliance Date"]} expiryDate={record["Compliance Expiry"]} />

      {/* Check Details */}
      <Stack tokens={{ childrenGap: 4 }}>
        <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
          <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Check ID:</Text>
          <Text variant="small">{record["Check ID"]}</Text>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
          <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Check Result:</Text>
          <Text variant="small">{record["Check Result"]}</Text>
        </Stack>
      </Stack>

      <Separator styles={{ root: { margin: '10px 0' } }} />

      {/* Individual Check Results */}
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Individual Check Results:</Text>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["PEP and Sanctions Check Result"] === "Passed" ? "Accept" : "Cancel"}
              styles={{ root: { color: record["PEP and Sanctions Check Result"] === "Passed" ? colours.green : colours.red } }}
            />
            <Text variant="small">PEP &amp; Sanctions: {record["PEP and Sanctions Check Result"]}</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["Address Verification Check Result"] === "Passed" ? "Accept" : "Cancel"}
              styles={{ root: { color: record["Address Verification Check Result"] === "Passed" ? colours.green : colours.red } }}
            />
            <Text variant="small">Address Verification: {record["Address Verification Check Result"]}</Text>
          </Stack>
        </Stack>
      </Stack>

      <Separator styles={{ root: { margin: '10px 0' } }} />

      {/* Risk Details */}
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Risk Details:</Text>
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <Text variant="small">Risk Assessor: {record["Risk Assessor"]}</Text>
          <Text variant="small">Risk Score: {record["Risk Score"]}</Text>
          <Text variant="small">Assessment: {record["Risk Assessment Result"]}</Text>
        </Stack>
      </Stack>

      <Separator styles={{ root: { margin: '10px 0' } }} />

      {/* Selections */}
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Selections:</Text>
        <Stack tokens={{ childrenGap: 2 }}>
          <Text variant="small">Client Type: {record["Client Type"]}</Text>
          <Text variant="small">Destination Of Funds: {record["Destination Of Funds"]}</Text>
          <Text variant="small">Funds Type: {record["Funds Type"]}</Text>
          <Text variant="small">How Was Client Introduced: {record["How Was Client Introduced"]}</Text>
          <Text variant="small">Limitation: {record["Limitation"]}</Text>
          <Text variant="small">Source Of Funds: {record["Source Of Funds"]}</Text>
          <Text variant="small">Value Of Instruction: {record["Value Of Instruction"]}</Text>
        </Stack>
      </Stack>

      <Separator styles={{ root: { margin: '10px 0' } }} />

      {/* Risk Factors */}
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Risk Factors:</Text>
        <Stack tokens={{ childrenGap: 5 }}>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["Client Risk Factors Considered"] ? "Accept" : "Cancel"}
              styles={{ root: { color: record["Client Risk Factors Considered"] ? colours.green : colours.red } }}
            />
            <Text variant="small">Client Risk Factors Considered</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["Transaction Risk Factors Considered"] ? "Accept" : "Cancel"}
              styles={{ root: { color: record["Transaction Risk Factors Considered"] ? colours.green : colours.red } }}
            />
            <Text variant="small">Transaction Risk Factors Considered</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Text variant="small">Transaction Risk Level: {record["Transaction Risk Level"]}</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["Firm-Wide AML Policy Considered"] ? "Accept" : "Cancel"}
              styles={{ root: { color: record["Firm-Wide AML Policy Considered"] ? colours.green : colours.red } }}
            />
            <Text variant="small">Firm-Wide AML Policy Considered</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["Firm-Wide Sanctions Risk Considered"] ? "Accept" : "Cancel"}
              styles={{ root: { color: record["Firm-Wide Sanctions Risk Considered"] ? colours.green : colours.red } }}
            />
            <Text variant="small">Firm-Wide Sanctions Risk Considered</Text>
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
};

// -----------------------------------------------------------------
// MatterOverview Component
// -----------------------------------------------------------------

interface MatterOverviewProps {
  matter: Matter;
  overviewData?: any;
  outstandingData?: any;
  complianceData?: any;
  matterSpecificActivitiesData?: any;
  onEdit?: () => void;
  transactions?: Transaction[]; // NEW: add transactions
}

// Define a fixed style for labels to ensure alignment
const labelStyleFixed = mergeStyles({
  fontWeight: 700,
  color: colours.highlight,
  minWidth: '120px',
});

const MatterOverview: React.FC<MatterOverviewProps> = ({
  matter,
  overviewData,
  outstandingData,
  complianceData,
  matterSpecificActivitiesData,
  onEdit,
  transactions, // NEW: include transactions here
}) => {
  const { isDarkMode } = useTheme();
  const ratingStyle = mapRatingToStyle(matter.Rating);
  const client = overviewData?.client;

  const handleRatingClick = () => {
    if (onEdit) onEdit();
  };

  const matterLink = `https://eu.app.clio.com/nc/#/matters/${matter.UniqueID || '-'}`;
  const clientLink = client ? `https://eu.app.clio.com/nc/#/contacts/${client.id}` : '#';

  // NEW: Filter transactions for the current matter
  const matterTransactions = transactions?.filter(
    (t) => t.matter_ref === matter.DisplayNumber
  ) || [];

  // Build a map of solicitor names to roles
  const solicitorMap: { [name: string]: string[] } = {};
  if (matter.OriginatingSolicitor?.trim()) {
    const name = matter.OriginatingSolicitor.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Originating');
  }
  if (matter.ResponsibleSolicitor?.trim()) {
    const name = matter.ResponsibleSolicitor.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Responsible');
  }
  if (matter.SupervisingPartner?.trim()) {
    const name = matter.SupervisingPartner.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Supervising');
  }

  // -----------------------------------------------------------------
  // Styles for various sections
  // -----------------------------------------------------------------
  const containerStyleFixed = mergeStyles({
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: 'Raleway, sans-serif',
  });

  const topSectionStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const matterReferenceStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  });

  const referenceTextStyle = mergeStyles({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colours.highlight,
    textDecoration: 'none',
  });

  const ratingBubbleStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    backgroundColor: ratingStyle.isBorder ? 'transparent' : ratingStyle.color,
    border: ratingStyle.isBorder ? `2px solid ${ratingStyle.color}` : 'none',
    color: ratingStyle.isBorder
      ? isDarkMode
        ? colours.dark.text
        : colours.light.text
      : 'white',
    selectors: {
      ':hover': {
        transform: 'scale(1.1)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
      },
    },
  });

  const infoSectionWrapper = mergeStyles({
    marginTop: '20px',
  });

  const infoCardStyle = mergeStyles({
    flex: '1 1 320px',
    minWidth: '280px',
    backgroundColor: isDarkMode ? '#262626' : '#fff',
    borderRadius: '8px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
    padding: '16px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    selectors: {
      ':hover': {
        transform: 'scale(1.02)',
        boxShadow: isDarkMode
          ? '0 4px 16px rgba(0,0,0,0.7)'
          : '0 4px 16px rgba(0,0,0,0.2)',
      },
    },
  });

  const baseTextStyle = {
    root: {
      color: isDarkMode ? colours.dark.text : colours.light.text,
      fontSize: 'small',
      lineHeight: '1.5',
    },
  };

  const personaStyle = mergeStyles({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: colours.highlight,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    marginRight: 8,
    cursor: 'default',
  });

  const iconButtonStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#555' : colours.grey,
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s, transform 0.2s',
    color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
    selectors: {
      ':hover': {
        backgroundColor: colours.blue,
        transform: 'scale(1.05)',
        color: 'white',
      },
    },
  });

  const tagStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colours.tagBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: 'small',
    marginRight: '8px',
    marginBottom: '8px',
  });

  /* ------------------------------------------
   * State for Revealable Datasets
   * ------------------------------------------
   */
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [outstandingOpen, setOutstandingOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false); // NEW

  /* ------------------------------------------
   * Bottom Revealable Panels Styling
   * ------------------------------------------
   */
  const panelStyle = mergeStyles({
    flex: 1,
    border: `1px solid ${colours.grey}`,
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
    overflow: 'auto',
    maxHeight: '300px',
  });

  /* ------------------------------------------
   * R E T U R N  M A I N  J S X
   * ------------------------------------------
   */
  return (
    <div className={containerStyleFixed}>
      {/* TOP SECTION: Matter reference & rating */}
      <div className={topSectionStyle}>
        <div className={matterReferenceStyle}>
          <Icon
            iconName="OpenFolderHorizontal"
            styles={{ root: { fontSize: 28, color: colours.highlight } }}
          />
          <Link href={matterLink} target="_blank" className={referenceTextStyle}>
            {matter.DisplayNumber || '-'}
          </Link>
        </div>
        {matter.Rating !== undefined && (
          <TooltipHost content={matter.Rating ? `Edit Rating: ${matter.Rating}` : 'Not Rated'}>
            <div
              className={ratingBubbleStyle}
              onClick={handleRatingClick}
              title="Edit Rating"
              aria-label="Edit Rating"
            >
              <Icon iconName={ratingStyle.icon} />
            </div>
          </TooltipHost>
        )}
      </div>

      {/* NEW LAYOUT: Two columns – Left (Financial Section + Matter Details), Right (Client Card) */}
      <div className={infoSectionWrapper}>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { flex: 2 } }}>
            {/* Financial Section */}
            <FinancialSection
              matterSpecificActivitiesData={matterSpecificActivitiesData}
              outstandingData={outstandingData}
              overviewData={overviewData}
              isDarkMode={isDarkMode}
            />
            {/* Matter Details Card */}
            <div className={infoCardStyle}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
                Matter Details
              </Text>
              <Separator />
              {/* First Section: Practice Area, Description, Opponent */}
              <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text variant="mediumPlus" styles={{ root: labelStyleFixed }}>
                    Practice Area:
                  </Text>
                  <Text variant="medium" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                    {matter.PracticeArea?.trim() || '-'}
                  </Text>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text variant="mediumPlus" styles={{ root: labelStyleFixed }}>
                    Description:
                  </Text>
                  <Text variant="medium" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                    {matter.Description?.trim() || '-'}
                  </Text>
                </Stack>
                {matter.Opponent?.trim() && (
                  <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                    <Text variant="mediumPlus" styles={{ root: labelStyleFixed }}>
                      Opponent:
                    </Text>
                    <Text variant="medium" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                      {matter.Opponent.trim()}
                    </Text>
                  </Stack>
                )}
              </Stack>

              <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />

              {/* Second Section: Open Date, CCL Date */}
              <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text variant="mediumPlus" styles={{ root: labelStyleFixed }}>
                    Open Date:
                  </Text>
                  <Text variant="medium" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                    {formatDate(matter.OpenDate)}
                  </Text>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Text variant="mediumPlus" styles={{ root: labelStyleFixed }}>
                    CCL Date:
                  </Text>
                  <Text variant="medium" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                    {formatDate(matter.CCL_date)}
                  </Text>
                </Stack>
              </Stack>

              <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />

              {/* Third Section: Solicitor Persona Bubbles */}
              <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
                {Object.entries(solicitorMap).map(([name, roles], idx) => (
                  <TooltipHost key={idx} content={`${name} (${roles.join(', ')})`}>
                    <div className={personaStyle}>{getInitials(name)}</div>
                  </TooltipHost>
                ))}
              </Stack>
            </div>
          </Stack.Item>
          <Stack.Item styles={{ root: { flex: 1 } }}>
            {/* Client Card */}
            <div className={infoCardStyle}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
                Client
              </Text>
              <Separator />
              <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: '12px' } }}>
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                  <Icon
                    iconName={client?.type === 'Company' ? 'CityNext' : 'Contact'}
                    styles={{ root: { fontSize: 24, color: colours.highlight } }}
                  />
                  <Link
                    href={clientLink}
                    target="_blank"
                    styles={{
                      root: {
                        fontSize: 'medium',
                        fontWeight: 600,
                        color: colours.highlight,
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {client?.name || '-'}
                  </Link>
                  <Text variant="small" styles={{ root: { marginLeft: '8px', color: colours.greyText } }}>
                    {client?.type || '-'}
                  </Text>
                </Stack>
                <Separator />
                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
                  <TooltipHost content="Call Client">
                    <div
                      className={iconButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = client?.primary_phone_number
                          ? `tel:${client.primary_phone_number}`
                          : '#';
                      }}
                      title="Call Client"
                      aria-label="Call Client"
                    >
                      <Icon iconName="Phone" />
                    </div>
                  </TooltipHost>
                  <TooltipHost content="Email Client">
                    <div
                      className={iconButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = client?.primary_email_address
                          ? `mailto:${client.primary_email_address}`
                          : '#';
                      }}
                      title="Email Client"
                      aria-label="Email Client"
                    >
                      <Icon iconName="Mail" />
                    </div>
                  </TooltipHost>
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="small" styles={baseTextStyle}>
                      {client?.primary_phone_number || '-'}
                    </Text>
                    <Text variant="small" styles={baseTextStyle}>
                      {client?.primary_email_address || '-'}
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
              {/* Render Compliance Details within Client Card */}
              {complianceData && Array.isArray(complianceData) && complianceData.length > 0 && (
                <>
                  <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />
                  <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
                    Compliance Details
                  </Text>
                  {([...complianceData] as ComplianceRecord[])
                    .sort(
                      (a, b) =>
                        new Date(b["Compliance Date"]).getTime() - new Date(a["Compliance Date"]).getTime()
                    )
                    .map((record, idx) => (
                      <ComplianceDetails key={idx} record={record} />
                    ))}
                </>
              )}
            </div>
          </Stack.Item>
        </Stack>
      </div>

      {/* INLINE TAGS */}
      <Stack horizontal wrap tokens={{ childrenGap: 8, padding: '12px 0' }}>
        <span className={tagStyle}>Matter ID: {matter.UniqueID || '-'}</span>
        <span className={tagStyle}>Client ID: {matter.ClientID || '-'}</span>
        <span className={tagStyle}>Value: {getValue(matter.ApproxValue)}</span>
        {matter.Source && matter.Source.trim() && (
          <span className={tagStyle}>Source: {matter.Source.trim()}</span>
        )}
        {matter.Referrer && matter.Referrer.trim() && (
          <span className={tagStyle}>Referrer: {matter.Referrer.trim()}</span>
        )}
      </Stack>

      {/* BOTTOM SECTION: Revealable Panels */}
      <Stack tokens={{ childrenGap: 10, padding: '20px 0' }}>
        {/* Buttons Row */}
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <DefaultButton text="Overview" onClick={() => setOverviewOpen(!overviewOpen)} />
          <DefaultButton text="Outstanding" onClick={() => setOutstandingOpen(!outstandingOpen)} />
          <DefaultButton text="Compliance" onClick={() => setComplianceOpen(!complianceOpen)} />
          <DefaultButton text="Activities" onClick={() => setActivitiesOpen(!activitiesOpen)} />
          <DefaultButton text="Transactions" onClick={() => setTransactionsOpen(!transactionsOpen)} />
        </Stack>

        {/* Conditionally render dataset panels side by side */}
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          {overviewOpen && (
            <div className={panelStyle}>
              <pre>{JSON.stringify(overviewData || { info: 'No overview data available.' }, null, 2)}</pre>
            </div>
          )}
          {outstandingOpen && (
            <div className={panelStyle}>
              <pre>{JSON.stringify(outstandingData || { info: 'No outstanding data found.' }, null, 2)}</pre>
            </div>
          )}
          {complianceOpen && (
            <div className={panelStyle}>
              <pre>{JSON.stringify(complianceData || { info: 'No compliance data available.' }, null, 2)}</pre>
            </div>
          )}
          {activitiesOpen && (
            <div className={panelStyle}>
              <pre>
                {JSON.stringify(
                  matterSpecificActivitiesData || { info: 'No matter-specific activities data available.' },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
          {transactionsOpen && (
            <div className={panelStyle}>
              <pre>{JSON.stringify(matterTransactions || { info: 'No transactions available.' }, null, 2)}</pre>
            </div>
          )}
        </Stack>
      </Stack>
    </div>
  );
};

export default MatterOverview;
