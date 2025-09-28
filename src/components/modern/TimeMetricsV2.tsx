import React from 'react';
import { FiClock, FiTrendingUp, FiTarget } from 'react-icons/fi';
import { FaMoneyBillWave } from 'react-icons/fa';
import { colours } from '../../app/styles/colours';
import EnquiryMetricsV2 from './EnquiryMetricsV2';

interface TimeMetric {
  title: string;
  isTimeMoney?: boolean;
  isMoneyOnly?: boolean;
  money?: number;
  hours?: number;
  prevMoney?: number;
  prevHours?: number;
  showDial?: boolean;
  dialTarget?: number;
  count?: number;
  prevCount?: number;
}

interface EnquiryMetric {
  title: string;
  count?: number;
  prevCount?: number;
  percentage?: number;
  prevPercentage?: number;
  isPercentage?: boolean;
}

interface TimeMetricsV2Props {
  metrics: TimeMetric[];
  enquiryMetrics?: EnquiryMetric[];
  isDarkMode: boolean;
}

const TimeMetricsV2: React.FC<TimeMetricsV2Props> = ({ metrics, enquiryMetrics, isDarkMode }) => {
  const [showEnquiryMetrics, setShowEnquiryMetrics] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const calculateProgress = (metric: TimeMetric): number => {
    if (metric.showDial && metric.dialTarget) {
      const current = metric.isTimeMoney ? (metric.hours || 0) : (metric.count || 0);
      return Math.min((current / metric.dialTarget) * 100, 100);
    }
    return 0;
  };

  const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
    switch (direction) {
      case 'up': return '#10B981'; // Green
      case 'down': return '#EF4444'; // Red
      default: return isDarkMode ? '#9CA3AF' : '#6B7280'; // Gray
    }
  };

  const getIcon = (metric: TimeMetric | EnquiryMetric) => {
    if (metric.title.toLowerCase().includes('outstanding')) return FaMoneyBillWave;
    if (metric.title.toLowerCase().includes('fees')) return FaMoneyBillWave;
    if (metric.title.toLowerCase().includes('time')) return FiClock;
    if (metric.title.toLowerCase().includes('enquir')) return FiTarget;
    if (metric.title.toLowerCase().includes('matter')) return FiTarget;
    if (metric.title.toLowerCase().includes('conversion')) return FiTarget;
    return FiTarget;
  };

  // Count-up animation hook
  const useCountUp = (target: number, durationMs: number = 700): number => {
    const [value, setValue] = React.useState(0);
    const previousTargetRef = React.useRef(0);
    React.useEffect(() => {
      if (!Number.isFinite(target)) {
        setValue(0);
        previousTargetRef.current = 0;
        return;
      }

      const startValue = previousTargetRef.current;
      const delta = target - startValue;
      const startTime = performance.now();
      let raf = 0;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(startValue + delta * eased);
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          previousTargetRef.current = target;
        }
      };

      setValue(startValue);
      raf = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(raf);
      };
    }, [target, durationMs]);

    return value;
  };

  const AnimatedValue: React.FC<{ value: number; formatter: (n: number) => string; className?: string; style?: React.CSSProperties }>
    = ({ value, formatter, className, style }) => {
      const animated = useCountUp(value);
      return <span className={className} style={style}>{formatter(animated)}</span>;
    };
    const AnimatedValueWithEnabled: React.FC<{ value: number; formatter: (n: number) => string; enabled: boolean; className?: string; style?: React.CSSProperties }>
      = ({ value, formatter, enabled, className, style }) => {
        const animated = useCountUp(enabled ? value : 0);
        const toRender = enabled ? animated : value;
        return <span className={className} style={style}>{formatter(toRender)}</span>;
      };

  const getDisplaySpec = (metric: TimeMetric): { value: number; formatter: (n: number) => string } => {
    if (metric.isMoneyOnly) {
      return { value: metric.money || 0, formatter: (n) => formatCurrency(Math.round(n)) };
    }
    if (metric.isTimeMoney) {
      return { value: metric.hours || 0, formatter: (n) => formatHours(n) };
    }
    return { value: metric.count || 0, formatter: (n) => Math.round(n).toString() };
  };

  // Type guards
  const isTimeMetric = (metric: TimeMetric | EnquiryMetric): metric is TimeMetric => {
    return 'isTimeMoney' in metric || 'isMoneyOnly' in metric || 'money' in metric || 'hours' in metric;
  };

  const isEnquiryMetric = (metric: TimeMetric | EnquiryMetric): metric is EnquiryMetric => {
    return 'isPercentage' in metric || 'percentage' in metric;
  };

  // Determine which metrics to display
  const currentMetrics = showEnquiryMetrics ? (enquiryMetrics || []) : metrics;
  // Run entrance/count-up animations only once per session/tab refresh
  const [enableAnimationThisMount] = React.useState<boolean>(() => {
    try { return sessionStorage.getItem('tmv2_animated') !== 'true'; } catch { return true; }
  });
  React.useEffect(() => {
    if (enableAnimationThisMount) {
      setMounted(false);
      const t = setTimeout(() => {
        setMounted(true);
        try { sessionStorage.setItem('tmv2_animated', 'true'); } catch {}
      }, 0);
      return () => clearTimeout(t);
    }
    setMounted(true);
  }, [enableAnimationThisMount]);

  const staggerStyle = (index: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(6px)',
    transition: 'opacity 300ms ease, transform 300ms ease',
    transitionDelay: `${index * 80}ms`,
  });
  

  // Helper function to get current value
  const getCurrentValue = (metric: TimeMetric | EnquiryMetric): number => {
    if (isTimeMetric(metric)) {
      return metric.isMoneyOnly ? (metric.money || 0) : 
             metric.isTimeMoney ? (metric.hours || 0) : (metric.count || 0);
    } else {
      return metric.isPercentage ? (metric.percentage || 0) : (metric.count || 0);
    }
  };

  // Helper function to get previous value
  const getPrevValue = (metric: TimeMetric | EnquiryMetric): number => {
    if (isTimeMetric(metric)) {
      return metric.isMoneyOnly ? (metric.prevMoney || 0) : 
             metric.isTimeMoney ? (metric.prevHours || 0) : (metric.prevCount || 0);
    } else {
      return metric.isPercentage ? (metric.prevPercentage || 0) : (metric.prevCount || 0);
    }
  };

  // Helper function to format value display
  const formatValue = (metric: TimeMetric | EnquiryMetric): string => {
    if (isTimeMetric(metric)) {
      return metric.isMoneyOnly ? formatCurrency(metric.money || 0) :
             metric.isTimeMoney ? formatHours(metric.hours || 0) :
             (metric.count || 0).toString();
    } else {
      return metric.isPercentage ? `${(metric.percentage || 0)}%` : (metric.count || 0).toString();
    }
  };

  // If showing enquiry metrics, render the EnquiryMetricsV2 component instead
  if (showEnquiryMetrics && enquiryMetrics) {
    const headerActions = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '13px',
          color: isDarkMode ? '#E5E7EB' : '#111827',
          fontWeight: showEnquiryMetrics ? 400 : 700,
        }}>
          Time
        </span>
        <button
          onClick={() => setShowEnquiryMetrics(!showEnquiryMetrics)}
          style={{
            width: '50px',
            height: '26px',
            borderRadius: '13px',
            border: `1px solid ${isDarkMode ? '#374151' : '#CBD5E1'}`,
            background: showEnquiryMetrics 
              ? colours.highlight
              : (isDarkMode ? '#111827' : '#FFFFFF'),
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDarkMode ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(0,0,0,0.02)'
          }}
          aria-label="Toggle Time/Enquiries"
        >
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: isDarkMode ? '#E5E7EB' : '#FFFFFF',
            border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
            position: 'absolute',
            top: '1px',
            left: showEnquiryMetrics ? '24px' : '2px',
            transition: 'all 0.2s ease',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
          }} />
        </button>
        <span style={{
          fontSize: '13px',
          color: isDarkMode ? '#E5E7EB' : '#111827',
          fontWeight: showEnquiryMetrics ? 700 : 400,
        }}>
          Conversion
        </span>
      </div>
    );

    return (
      <div style={{ padding: '0', margin: '0', position: 'relative', background: 'transparent' }}>
        <EnquiryMetricsV2 
          metrics={enquiryMetrics} 
          isDarkMode={isDarkMode} 
          headerActions={headerActions}
          title={'Conversion Metrics'}
        />
      </div>
    );
  }

  return (
    <div style={{
      padding: '0 16px',
      margin: '0',
      position: 'relative',
      background: 'transparent',
    }}>
      {/* Unified Time Metrics Container with integrated header (match SectionCard visuals) */}
      <div style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0B1224 0%, #0F1B33 100%)'
          : `linear-gradient(135deg, ${colours.light.cardBackground} 0%, rgba(54, 144, 206, 0.05) 100%)`,
        borderRadius: '8px',
        border: isDarkMode 
          ? `1px solid ${colours.dark.border}` 
          : `1px solid ${colours.light.border}`,
        boxShadow: isDarkMode
          ? '0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.08)'
          : '0 2px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.01)',
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Header inside the container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: isDarkMode 
            ? `1px solid ${colours.dark.border}` 
            : `1px solid ${colours.light.border}`,
          marginBottom: '12px',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkMode ? colours.dark.text : colours.light.text,
            letterSpacing: '-0.025em',
          }}>
            Time Metrics
          </h2>
          
          {/* Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '13px', color: isDarkMode ? '#E5E7EB' : '#111827', fontWeight: showEnquiryMetrics ? 400 : 700 }}>Time</span>
            <button
              onClick={() => setShowEnquiryMetrics(!showEnquiryMetrics)}
              style={{
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                border: `1px solid ${isDarkMode ? '#374151' : '#CBD5E1'}`,
                background: showEnquiryMetrics 
                  ? colours.highlight
                  : (isDarkMode ? '#111827' : '#FFFFFF'),
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isDarkMode ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(0,0,0,0.02)'
              }}
              aria-label="Toggle Time/Enquiries"
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: isDarkMode ? '#E5E7EB' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? '#4B5563' : '#E5E7EB'}`,
                position: 'absolute',
                top: '1px',
                left: showEnquiryMetrics ? '24px' : '2px',
                transition: 'all 0.2s ease',
                boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
              }} />
            </button>
            <span style={{ fontSize: '13px', color: isDarkMode ? '#E5E7EB' : '#111827', fontWeight: showEnquiryMetrics ? 700 : 400 }}>Conversion</span>
          </div>
        </div>
        
        {/* Metrics content with padding */}
        <div style={{
          padding: '0 16px 16px 16px',
        }}>
          {/* Match original metricsGridThree layout */}
          <div className="metricsGridThree" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: currentMetrics.length > 3 ? '16px' : '0',
          }}>
            {/* First row - first 3 metrics */}
            {currentMetrics.slice(0, 3).map((metric, index) => {
          const Icon = getIcon(metric);
          const currentValue = getCurrentValue(metric);
          const prevValue = getPrevValue(metric);
          const progress = isTimeMetric(metric) ? calculateProgress(metric) : 0;
          const trend = getTrendDirection(currentValue, prevValue);
          const trendColor = getTrendColor(trend);

          return (
            <div
              key={metric.title}
              style={{
                background: isDarkMode 
                  ? colours.dark.cardBackground
                  : colours.light.cardBackground,
                borderRadius: '8px',
                padding: '20px',
                border: isDarkMode 
                  ? `1px solid ${colours.dark.border}`
                  : `1px solid ${colours.light.border}`,
                boxShadow: isDarkMode
                  ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                cursor: 'default',
                // Natural card styling that sits on the page background
                ...staggerStyle(index),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDarkMode
                  ? '0 8px 25px rgba(0, 0, 0, 0.4)'
                  : '0 8px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: isDarkMode 
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                }}>
                  <Icon size={14} />
                </div>
                {trend !== 'neutral' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: trendColor,
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    <FiTrendingUp 
                      size={12} 
                      style={{ 
                        transform: trend === 'down' ? 'rotate(180deg)' : 'none' 
                      }} 
                    />
                  </div>
                )}
              </div>

              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '13px',
                fontWeight: 500,
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                lineHeight: '1.2',
              }}>
                {metric.title}
              </h3>

              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: (isTimeMetric(metric) && metric.showDial) ? '16px' : '0',
              }}>
                <AnimatedValueWithEnabled
                  value={getDisplaySpec(metric).value}
                  formatter={getDisplaySpec(metric).formatter}
                  enabled={enableAnimationThisMount}
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    letterSpacing: '-0.025em',
                  }}
                />
                {isTimeMetric(metric) && metric.isTimeMoney && metric.money && (
                  <AnimatedValueWithEnabled
                    value={metric.money || 0}
                    formatter={(n) => formatCurrency(Math.round(n))}
                    enabled={enableAnimationThisMount}
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isDarkMode ? '#10B981' : '#059669',
                    }}
                  />
                )}
              </div>

              {isTimeMetric(metric) && metric.showDial && metric.dialTarget && (
                <div style={{
                  position: 'relative',
                  marginTop: '12px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: isDarkMode ? '#9CA3AF' : '#6B7280',
                      fontWeight: 500,
                    }}>
                      Progress
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: isDarkMode ? '#9CA3AF' : '#6B7280',
                      fontWeight: 500,
                    }}>
                      Target: {isTimeMetric(metric) ? metric.dialTarget : 0}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: progress >= 100 
                        ? `linear-gradient(90deg, ${colours.green} 0%, rgba(32, 178, 108, 0.8) 100%)`
                        : `linear-gradient(90deg, ${colours.highlight} 0%, rgba(54, 144, 206, 0.8) 100%)`,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '10px',
                    color: isDarkMode ? '#6B7280' : '#9CA3AF',
                    textAlign: 'right',
                  }}>
                    {progress.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
        
        {/* Second row - remaining metrics if any */}
        {currentMetrics.length > 3 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: '16px',
          }}>
            {currentMetrics.slice(3).map((metric, index) => {
              const Icon = getIcon(metric);
              const currentValue = getCurrentValue(metric);
              const prevValue = getPrevValue(metric);
              const progress = isTimeMetric(metric) ? calculateProgress(metric) : 0;
              const trend = getTrendDirection(currentValue, prevValue);
              const trendColor = getTrendColor(trend);

              return (
                <div
                  key={metric.title}
                  style={{
                    background: isDarkMode 
                      ? colours.dark.cardBackground
                      : colours.light.cardBackground,
                    borderRadius: '8px',
                    padding: '20px',
                    border: isDarkMode 
                      ? `1px solid ${colours.dark.border}`
                      : `1px solid ${colours.light.border}`,
                    boxShadow: isDarkMode
                      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                    ...staggerStyle(index + 3),
                  }}
                >
                  {/* Same card content structure */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <Icon size={16} style={{
                        color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
                      }} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      }}>
                        {metric.title}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: trendColor,
                      fontWeight: 600,
                    }}>
                      {trend === 'up' && '↗'}
                      {trend === 'down' && '↘'}
                      {trend === 'neutral' && '→'}
                      <span>
                        {trend === 'up' && '+'}
                        {Math.abs(((currentValue - prevValue) / (prevValue || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    marginBottom: '8px',
                  }}>
                    <AnimatedValueWithEnabled
                      value={getDisplaySpec(metric as TimeMetric).value}
                      formatter={getDisplaySpec(metric as TimeMetric).formatter}
                      enabled={enableAnimationThisMount}
                    />
                  </div>

                  {isTimeMetric(metric) && metric.isTimeMoney && metric.money && (
                    <div style={{
                      fontSize: '12px',
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      marginBottom: '12px',
                    }}>
                      <AnimatedValueWithEnabled
                        value={metric.money || 0}
                        formatter={(n) => `£${Math.round(n).toLocaleString()}`}
                        enabled={enableAnimationThisMount}
                      />
                    </div>
                  )}

                  {/* Progress bar */}
                  {isTimeMetric(metric) && metric.showDial && (
                    <div style={{
                      marginTop: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          color: isDarkMode ? '#9CA3AF' : '#6B7280',
                          fontWeight: 500,
                        }}>
                          Progress
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: isDarkMode ? '#9CA3AF' : '#6B7280',
                          fontWeight: 500,
                        }}>
                          Target: {isTimeMetric(metric) ? metric.dialTarget : 0}
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: progress >= 100 
                            ? `linear-gradient(90deg, ${colours.green} 0%, rgba(32, 178, 108, 0.8) 100%)`
                            : `linear-gradient(90deg, ${colours.highlight} 0%, rgba(54, 144, 206, 0.8) 100%)`,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <div style={{
                        marginTop: '4px',
                        fontSize: '10px',
                        color: isDarkMode ? '#6B7280' : '#9CA3AF',
                        textAlign: 'right',
                      }}>
                        {progress.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div> {/* Close metrics content padding */}
      </div> {/* Close unified Time Metrics container */}
    </div>
  );
};

export default TimeMetricsV2;