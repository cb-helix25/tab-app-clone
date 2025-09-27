import React from 'react';
import { FiTrendingUp, FiTarget, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { colours } from '../../app/styles/colours';

interface EnquiryMetric {
  title: string;
  count?: number;
  prevCount?: number;
  percentage?: number;
  prevPercentage?: number;
  isPercentage?: boolean;
  showTrend?: boolean;
}

interface EnquiryMetricsV2Props {
  metrics: EnquiryMetric[];
  isDarkMode: boolean;
}

const EnquiryMetricsV2: React.FC<EnquiryMetricsV2Props> = ({ metrics, isDarkMode }) => {
  
  const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral'): string => {
    switch (trend) {
      case 'up': return colours.green;
      case 'down': return colours.cta;
      default: return isDarkMode ? colours.dark.subText : colours.light.subText;
    }
  };

  const getIcon = (metric: EnquiryMetric) => {
    if (metric.title.toLowerCase().includes('enquir')) return FiUsers;
    if (metric.title.toLowerCase().includes('matter')) return FiCheckCircle;
    if (metric.title.toLowerCase().includes('conversion')) return FiTarget;
    if (metric.title.toLowerCase().includes('response')) return FiTrendingUp;
    if (metric.title.toLowerCase().includes('satisfaction')) return FiCheckCircle;
    return FiTarget;
  };

  const getCurrentValue = (metric: EnquiryMetric): number => {
    return metric.isPercentage ? (metric.percentage || 0) : (metric.count || 0);
  };

  const getPrevValue = (metric: EnquiryMetric): number => {
    return metric.isPercentage ? (metric.prevPercentage || 0) : (metric.prevCount || 0);
  };

  const formatValue = (metric: EnquiryMetric): string => {
    if (metric.isPercentage) {
      return `${(metric.percentage || 0).toFixed(1)}%`;
    }
    return (metric.count || 0).toLocaleString();
  };

  const formatTrendValue = (current: number, previous: number, isPercentage: boolean): string => {
    const diff = current - previous;
    const sign = diff > 0 ? '+' : '';
    if (isPercentage) {
      return `${sign}${diff.toFixed(1)}%`;
    }
    return `${sign}${diff}`;
  };

  return (
    <div style={{
      padding: '20px',
      margin: '0',
      position: 'relative',
      background: 'transparent',
    }}>
      {/* Unified Enquiry Metrics Container */}
      <div style={{
        background: isDarkMode 
          ? `linear-gradient(135deg, ${colours.dark.cardBackground} 0%, rgba(54, 144, 206, 0.1) 100%)`
          : `linear-gradient(135deg, ${colours.light.cardBackground} 0%, rgba(54, 144, 206, 0.05) 100%)`,
        borderRadius: '12px',
        border: isDarkMode 
          ? `1px solid ${colours.dark.border}` 
          : `1px solid ${colours.light.border}`,
        boxShadow: isDarkMode
          ? '0 4px 6px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: isDarkMode 
            ? `1px solid ${colours.dark.border}` 
            : `1px solid ${colours.light.border}`,
          marginBottom: '20px',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkMode ? colours.dark.text : colours.light.text,
            letterSpacing: '-0.025em',
          }}>
            Enquiry & Conversion Metrics
          </h2>
        </div>
        
        {/* Metrics Content */}
        <div style={{
          padding: '0 20px 20px 20px',
        }}>
          {/* First row - first 3 metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: metrics.length > 3 ? '16px' : '0',
          }}>
            {metrics.slice(0, 3).map((metric, index) => {
              const Icon = getIcon(metric);
              const currentValue = getCurrentValue(metric);
              const prevValue = getPrevValue(metric);
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
                  {/* Header with icon and trend */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${colours.highlight} 0%, rgba(54, 144, 206, 0.8) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
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
                        <span>{formatTrendValue(currentValue, prevValue, metric.isPercentage || false)}</span>
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

                  {/* Main value */}
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    letterSpacing: '-0.025em',
                    marginBottom: '8px',
                  }}>
                    {formatValue(metric)}
                  </div>

                  {/* Progress indicator for percentages */}
                  {metric.isPercentage && (
                    <div style={{
                      marginTop: '12px',
                    }}>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min((metric.percentage || 0), 100)}%`,
                          height: '100%',
                          background: (metric.percentage || 0) >= 80 
                            ? `linear-gradient(90deg, ${colours.green} 0%, rgba(32, 178, 108, 0.8) 100%)`
                            : `linear-gradient(90deg, ${colours.highlight} 0%, rgba(54, 144, 206, 0.8) 100%)`,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Second row - remaining metrics if any */}
          {metrics.length > 3 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              {metrics.slice(3).map((metric, index) => {
                const Icon = getIcon(metric);
                const currentValue = getCurrentValue(metric);
                const prevValue = getPrevValue(metric);
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
                    }}
                  >
                    {/* Header with icon and trend */}
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
                      {trend !== 'neutral' && (
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

                          <span>{formatTrendValue(currentValue, prevValue, metric.isPercentage || false)}</span>
                        </div>
                      )}
                    </div>

                    {/* Main value */}
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: isDarkMode ? colours.dark.text : colours.light.text,
                      marginBottom: '8px',
                    }}>
                      {formatValue(metric)}
                    </div>

                    {/* Progress indicator for percentages */}
                    {metric.isPercentage && (
                      <div style={{
                        marginTop: '12px',
                      }}>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.min((metric.percentage || 0), 100)}%`,
                            height: '100%',
                            background: (metric.percentage || 0) >= 80 
                              ? `linear-gradient(90deg, ${colours.green} 0%, rgba(32, 178, 108, 0.8) 100%)`
                              : `linear-gradient(90deg, ${colours.highlight} 0%, rgba(54, 144, 206, 0.8) 100%)`,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnquiryMetricsV2;