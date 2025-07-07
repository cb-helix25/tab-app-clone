import React from 'react';
// invisible change
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  style?: React.CSSProperties; // Added style prop
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, style }) => {
  return (
    <div className="metric-card" style={style}> {/* Apply style here */}
      <div className="accent-bar" />
      <div className="content">
        <h3 className="metric-title">{title}</h3>
        <p className="metric-value">{value}</p>
        {subtitle && <p className="metric-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;