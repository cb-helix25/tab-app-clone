import React, { useState, useMemo } from 'react';
import { Text, mergeStyles, TooltipHost, DirectionalHint, Icon } from '@fluentui/react';
import CountUp from 'react-countup';
import { colours } from '../../app/styles/colours';
import '../../app/styles/MetricCard.css'; // Import the CSS file

// NEW: Import the circular progress bar
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface MetricCardProps {
  title: string;
  count?: number;
  prevCount?: number;
  hours?: number;
  prevHours?: number;
  money?: number | string;
  prevMoney?: number;
  isDarkMode: boolean;
  isTimeMoney?: boolean;
  isMoneyOnly?: boolean;
  animationDelay?: number;
  showDial?: boolean;
  dialTarget?: number;
  dialValue?: number;
  highlightDial?: boolean;
  dialSuffix?: string;
}

const cardStyle = (isDarkMode: boolean, isPositive: boolean | null) =>
  mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    padding: '8px 12px 8px 16px',
    borderLeft: `4px solid ${colours.highlight}`,
    borderRadius: '6px',
    boxShadow: isDarkMode ? `0 2px 6px ${colours.dark.border}` : `0 2px 6px ${colours.light.border}`,
    transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.2s, border 0.2s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 'auto',
    minHeight: '75px',
    flex: '1 1 30%',
    minWidth: '180px',
    maxWidth: '220px',
    cursor: 'pointer',
    outline: isPositive !== null
      ? `2px solid ${isPositive ? 'green' : 'red'}`
      : '2px solid transparent',
    outlineOffset: '-2px',
    ':hover': {
      transform: 'translateY(-3px)',
      boxShadow: isDarkMode ? `0 4px 8px ${colours.dark.border}` : `0 4px 8px ${colours.light.border}`,
    },
    position: 'relative',
  });

const metricTitleStyle = mergeStyles({
  fontSize: '12px',
  fontWeight: '600',
  marginBottom: '4px',
});

const moneyStyle = mergeStyles({
  fontSize: '16px',
  fontWeight: '700',
  color: colours.highlight,
});

const pipeStyle = mergeStyles({
  fontSize: '16px',
  fontWeight: '500',
  color: colours.greyText,
  margin: '0 8px',
});

const hoursStyle = mergeStyles({
  fontSize: '16px',
  fontWeight: '500',
  color: colours.greyText,
});

const changeStyle = (isPositive: boolean) =>
  mergeStyles({
    fontSize: '10px',
    fontWeight: '600',
    color: isPositive ? 'green' : 'red',
    marginTop: '4px',
  });

const renderDialLayout = (
  title: string,
  money: number | string | undefined,
  value: number | undefined,
  isDarkMode: boolean,
  dialTarget: number | undefined,
  dialSuffix?: string
) => {
  const progress = dialTarget && value ? Math.min((value / dialTarget) * 100, 100) : 0;
  return (
    <div
      className={mergeStyles({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
      })}
    >
      <div
        className={mergeStyles({
          width: 60,
          height: 60,
          marginRight: 12,
        })}
      >
        <CircularProgressbar
          value={progress}
          text={`${value !== undefined ? value.toFixed(2) : '0'}${dialSuffix ? dialSuffix : ''}`}
          styles={buildStyles({
            textSize: '16px',
            pathTransitionDuration: 0.5,
            pathColor: colours.highlight,
            textColor: isDarkMode ? colours.dark.text : colours.light.text,
            trailColor: colours.grey,
            backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
          })}
        />
      </div>
      <div>
        <Text className={metricTitleStyle}>{title}</Text>
        {dialSuffix === "%" ? (
          <Text
            className={mergeStyles({
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: colours.highlight,
            })}
          >
            <CountUp
              start={0}
              end={value ? Number(value) : 0}
              duration={2.5}
              separator=","
              decimals={2}
            />
            {dialSuffix}
          </Text>
        ) : (
          <Text className={mergeStyles({ display: 'flex', alignItems: 'center' })}>
            <span className={moneyStyle}>
              £
              <CountUp
                start={0}
                end={typeof money === 'number' ? Number(money) : 0}
                duration={2.5}
                separator=","
                decimals={typeof money === 'number' && money > 1000 ? 2 : 0}
              />
            </span>
            <span className={pipeStyle}>|</span>
            <span className={hoursStyle}>
              <CountUp
                start={0}
                end={value ? Number(value) : 0}
                duration={2.5}
                separator=","
                decimals={2}
              />{' '}
              hrs
            </span>
          </Text>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  count,
  prevCount,
  hours,
  prevHours,
  money,
  prevMoney,
  isDarkMode,
  isTimeMoney = false,
  isMoneyOnly = false,
  animationDelay = 0,
  showDial = false,
  dialTarget,
  dialValue,
  highlightDial,
  dialSuffix,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const calculateChange = (current: number, previous: number) => {
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;
    return { change, percentage };
  };

  const countChange =
    count !== undefined && prevCount !== undefined
      ? calculateChange(count, prevCount)
      : null;

  const moneyChange =
    money !== undefined && typeof money === 'number' && prevMoney !== undefined
      ? calculateChange(money, prevMoney)
      : null;

  const hoursChange =
    hours !== undefined && prevHours !== undefined
      ? calculateChange(hours, prevHours)
      : null;

  let overallChange: boolean | null = null;
  if (isTimeMoney) {
    if (moneyChange && hoursChange) {
      overallChange = moneyChange.change >= 0;
    } else if (moneyChange) {
      overallChange = moneyChange.change >= 0;
    } else if (hoursChange) {
      overallChange = hoursChange.change >= 0;
    }
  } else if (countChange) {
    overallChange = countChange.change >= 0;
  }
  
  // Force red for Outstanding Client Balances (since any outstanding value is bad)
  if (title === 'Outstanding Client Balances') {
    overallChange = false;
  }
  
  // Force green for Fees Recovered This Month (since fees recovered is good)
  if (title === 'Fees Recovered This Month') {
    overallChange = true;
  }

  const displayMoneyComponent = useMemo(() => (
    <CountUp
      key={`${title}-money`}
      start={0}
      end={typeof money === 'number' ? Number(money) : 0}
      duration={2.5}
      decimals={typeof money === 'number' && money > 1000 ? 2 : 0}
      separator=","
      suffix={typeof money === 'number' && money > 1000 ? "k" : ""}
    />
  ), [money, title]);

  const tooltipContent = () => {
    if (isMoneyOnly) {
      const labelText =
        title === 'Outstanding Client Balances'
          ? 'Outstanding Client Balances:'
          : 'Fees Recovered:';
      return (
        <div>
          <strong>{labelText}</strong> £
          {typeof money === 'number'
            ? money > 1000
              ? (money / 1000).toFixed(2) + 'k'
              : money.toFixed(2)
            : money}
        </div>
      );
    }
    if (isTimeMoney) {
      return (
        <>
          {moneyChange && (
            <div>
              <strong>Money:</strong> £{Math.abs(moneyChange.change).toLocaleString(undefined, {
                minimumFractionDigits: typeof money === 'number' && money > 1000 ? 2 : 0,
                maximumFractionDigits: typeof money === 'number' && money > 1000 ? 2 : 0,
              })}{' '}
              ({Math.abs(Number(moneyChange.percentage.toFixed(2)))}%{' '}
              {moneyChange.change >= 0 ? '↑' : '↓'})
            </div>
          )}
          {hoursChange && (
            <div>
              <strong>Hours:</strong> {Math.abs(hoursChange.change).toFixed(2)} hrs (
              {Math.abs(Number(hoursChange.percentage.toFixed(2)))}%{' '}
              {hoursChange.change >= 0 ? '↑' : '↓'})
            </div>
          )}
        </>
      );
    } else if (countChange) {
      return (
        <div>
          <strong>Change:</strong> {Math.abs(countChange.change).toLocaleString()} (
          {Math.abs(Number(countChange.percentage.toFixed(2)))}%{' '}
          {countChange.change >= 0 ? '↑' : '↓'})
        </div>
      );
    }
    return '';
  };

  return (
    <TooltipHost content={tooltipContent()} directionalHint={DirectionalHint.topCenter}>
      <div
        className={`metricCard ${mergeStyles(cardStyle(isDarkMode, isHovered ? overallChange : null))}`}
        style={{ '--animation-delay': `${animationDelay}s` } as React.CSSProperties}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${title} metric card`}
      >
        {showDial ? (
          renderDialLayout(title, money, dialValue !== undefined ? dialValue : hours, isDarkMode, dialTarget, dialSuffix)
        ) : (
          <>
            <Text className={metricTitleStyle}>{title}</Text>
            {isMoneyOnly ? (
              typeof money === 'string' ? (
                  <Text className={mergeStyles({ fontSize: '18px', fontWeight: '700', color: colours.highlight })}>
                    £{money}
                  </Text>
                ) : (
                  <Text className={mergeStyles({ fontSize: '18px', fontWeight: '700', color: colours.highlight })}>
                  £{displayMoneyComponent}
                </Text>
              )
            ) : isTimeMoney ? (
              <Text className={mergeStyles({ display: 'flex', alignItems: 'center' })}>
                <span className={moneyStyle}>
                  £
                  <CountUp
                    start={0}
                    end={typeof money === 'number' ? Number(money) : 0}
                    duration={2.5}
                    separator=","
                    decimals={typeof money === 'number' && money > 1000 ? 2 : 0}
                  />
                </span>
                <span className={pipeStyle}>|</span>
                <span className={hoursStyle}>
                  <CountUp
                    start={0}
                    end={hours ? Number(hours) : 0}
                    duration={2.5}
                    separator=","
                    decimals={2}
                  />{' '}
                  hrs
                </span>
              </Text>
            ) : (
                    <Text className={mergeStyles({ fontSize: '18px', fontWeight: '700', color: colours.highlight })}>
                {count !== undefined ? <CountUp start={0} end={Number(count)} duration={2.5} separator="," /> : ''}
              </Text>
            )}
          </>
        )}

        {isHovered && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '12px', // 12px wide bar
              backgroundColor: colours.grey, // grey bar
              borderTopRightRadius: '10px', // slightly less than the card's 12px to avoid excessive rounding
              borderBottomRightRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: title === 'Outstanding Client Balances' ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
          >
            <Icon iconName="ChevronRight" style={{ color: colours.light.text, fontSize: '12px' }} />
          </div>
        )}


        {isHovered && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '10px',
              justifyContent: 'space-between'
            }}
          >
            {isMoneyOnly ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '5px',
                  alignItems: 'center'
                }}
              >
                <Text
                  className={changeStyle(
                    title === 'Outstanding Client Balances'
                      ? false
                      : moneyChange ? moneyChange.change >= 0 : true
                  )}
                >
                  £
                  {typeof money === 'number'
                    ? money > 1000
                      ? (money / 1000).toFixed(2)
                      : money.toFixed(2)
                    : money}
                  {typeof money === 'number' && money > 1000 ? "k" : ""}
                </Text>
              </div>
            ) : isTimeMoney ? (
              <>
                {moneyChange && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '5px',
                      alignItems: 'center'
                    }}
                  >
                    <Text className={changeStyle(moneyChange.change >= 0)}>
                      £{Math.abs(moneyChange.change).toLocaleString(undefined, {
                        minimumFractionDigits: typeof money === 'number' && money > 1000 ? 2 : 0,
                        maximumFractionDigits: typeof money === 'number' && money > 1000 ? 2 : 0
                      })}
                    </Text>
                    <Text className={changeStyle(moneyChange.change >= 0)}>
                      ({Math.abs(Number(moneyChange.percentage.toFixed(2)))}%{' '}
                      {moneyChange.change >= 0 ? '↑' : '↓'})
                    </Text>
                  </div>
                )}
                {hoursChange && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '5px',
                      alignItems: 'center'
                    }}
                  >
                    <Text className={changeStyle(hoursChange.change >= 0)}>
                      {Math.abs(hoursChange.change).toFixed(2)} hrs
                    </Text>
                    <Text className={changeStyle(hoursChange.change >= 0)}>
                      ({Math.abs(Number(hoursChange.percentage.toFixed(2)))}%{' '}
                      {hoursChange.change >= 0 ? '↑' : '↓'})
                    </Text>
                  </div>
                )}
              </>
            ) : (
              countChange && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '5px',
                    alignItems: 'center'
                  }}
                >
                  <Text className={changeStyle(countChange.change >= 0)}>
                    {Math.abs(countChange.change).toLocaleString()}
                  </Text>
                  <Text className={changeStyle(countChange.change >= 0)}>
                    ({Math.abs(Number(countChange.percentage.toFixed(2)))}%{' '}
                    {countChange.change >= 0 ? '↑' : '↓'})
                  </Text>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </TooltipHost>
  );
};

export default React.memo(MetricCard);
