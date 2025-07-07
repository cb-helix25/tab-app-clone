import React from 'react';
// invisible change
import {
  Stack,
  Text,
  Icon,
  mergeStyles,
  Separator,
  TooltipHost,
  Link,
} from '@fluentui/react';
import { Matter, Transaction } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

// -----------------------------------------------------------------
// Helper Functions (unchanged)
// -----------------------------------------------------------------

const getInitials = (name: string): string => {
  if (!name.trim()) return '-';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr || !dateStr.trim()) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  } catch (err) {
    return '-';
  }
};

const getValue = (value?: string): string => {
  return value && value.trim() ? value : '-';
};

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
    return `£${(num / 1000).toFixed(0)}k`;
  }
  return num.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
};

const formatHours = (num: number): string => `${num.toFixed(2)}h`;

// -----------------------------------------------------------------
// FinancialSection Component (unchanged)
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
  const wipActivities = activities.filter((a: any) => !a.billed);
  const wipBillableActivities = wipActivities.filter((a: any) => !a.non_billable);
  const wipNonBillableActivities = wipActivities.filter((a: any) => a.non_billable);

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

  const outstandingBalance = outstandingData?.total_outstanding_balance || 0;
  const trustAccount = overviewData?.account_balances?.find((acc: any) => acc.type === 'Trust');
  const clientFunds = trustAccount ? trustAccount.balance : 0;

  const nonBillableColor = '#a3c9f1';

  return (
    <>
      <div
        className={mergeStyles({
          padding: '20px',
          borderRadius: 0,
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        })}
      >
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { justifyContent: 'space-between' } }}>
          <div className={mergeStyles({ flex: 1, borderRight: '1px solid #ccc', paddingRight: '10px' })}>
            <Text variant="large" styles={{ root: { color: colours.highlight } }}>Work in Progress</Text>
            <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: '10px' } }}>
              <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                <Text variant="small" styles={{ root: { color: colours.highlight } }}>Billable</Text>
                <Text variant="medium">{formatCurrency(wipBillableTotal)}</Text>
                <Text variant="small">Hours: {formatHours(wipBillableHours)}</Text>
              </Stack>
              <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
                <Text variant="small" styles={{ root: { color: colours.highlight } }}>Non-Billable</Text>
                <Text variant="medium">{formatCurrency(wipNonBillableTotal)}</Text>
                <Text variant="small">Hours: {formatHours(wipNonBillableHours)}</Text>
              </Stack>
            </Stack>
          </div>
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
          <div className={mergeStyles({ flex: 1, paddingLeft: '10px' })}>
            <Text variant="large" styles={{ root: { color: colours.highlight } }}>Client Funds (Matter)</Text>
            <Stack tokens={{ childrenGap: 4 }} styles={{ root: { marginTop: '10px' } }}>
              <Text variant="small" styles={{ root: { color: colours.highlight } }}>Funds</Text>
              <Text variant="medium">{formatCurrency(clientFunds)}</Text>
            </Stack>
          </div>
        </Stack>
      </div>
      <div
        className={mergeStyles({
          width: '100%',
          padding: '10px',
          borderRadius: 0,
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        })}
      >
        <Text variant="large" styles={{ root: { color: colours.highlight } }}>Time</Text>
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { justifyContent: 'space-between', marginTop: '10px' } }}>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>
            Billable: {formatCurrency(overallBillableTotal)} ({formatHours(overallBillableHours)})
          </Text>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>
            Non-Billable: {formatCurrency(overallNonBillableTotal)} ({formatHours(overallNonBillableHours)})
          </Text>
        </Stack>
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
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: '5px', justifyContent: 'space-between' } }}>
          <Text variant="small" styles={{ root: { color: colours.highlight } }}>Billable</Text>
          <Text variant="small" styles={{ root: { color: nonBillableColor } }}>Non-Billable</Text>
        </Stack>
      </div>
    </>
  );
};

// -----------------------------------------------------------------
// Compliance Components (unchanged)
// -----------------------------------------------------------------

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

const ComplianceDetails: React.FC<{ record: ComplianceRecord }> = ({ record }) => {
  const { isDarkMode } = useTheme();
  const containerStyle = mergeStyles({
    border: `1px solid ${colours.grey}`,
    borderRadius: 0,
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
  });

  return (
    <div className={containerStyle}>
      <ComplianceTimeline startDate={record["Compliance Date"]} expiryDate={record["Compliance Expiry"]} />
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
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Individual Check Results:</Text>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center">
            <Icon
              iconName={record["PEP and Sanctions Check Result"] === "Passed" ? "Accept" : "Cancel"}
              styles={{ root: { color: record["PEP and Sanctions Check Result"] === "Passed" ? colours.green : colours.red } }}
            />
            <Text variant="small">PEP & Sanctions: {record["PEP and Sanctions Check Result"]}</Text>
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
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>Risk Details:</Text>
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <Text variant="small">Risk Assessor: {record["Risk Assessor"]}</Text>
          <Text variant="small">Risk Score: {record["Risk Score"]}</Text>
          <Text variant="small">Assessment: {record["Risk Assessment Result"]}</Text>
        </Stack>
      </Stack>
      <Separator styles={{ root: { margin: '10px 0' } }} />
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
// MatterOverview Component (Modified)
// -----------------------------------------------------------------

interface MatterOverviewProps {
  matter: Matter;
  overviewData?: any;
  outstandingData?: any;
  complianceData?: any;
  matterSpecificActivitiesData?: any;
  onEdit?: () => void;
  transactions?: Transaction[];
}

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
  transactions,
}) => {
  const { isDarkMode } = useTheme();
  const ratingStyle = mapRatingToStyle(matter.Rating);
  const client = overviewData?.client;

  const handleRatingClick = () => {
    if (onEdit) onEdit();
  };

  const matterLink = `https://eu.app.clio.com/nc/#/matters/${matter.UniqueID || '-'}`;
  const clientLink = client ? `https://eu.app.clio.com/nc/#/contacts/${client.id}` : '#';

  const matterTransactions = transactions?.filter(
    (t) => t.matter_ref === matter.DisplayNumber
  ) || [];

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

  const containerStyleFixed = mergeStyles({
    padding: '20px',
    borderRadius: 0,
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
    borderRadius: 0,
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
    </div>
  );
};

export default MatterOverview;