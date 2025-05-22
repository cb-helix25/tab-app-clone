import React from "react";
import { colours } from '../../app/styles/colours';

interface ALCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  style?: React.CSSProperties;
}
const ALCard: React.FC<ALCardProps> = ({ title, value, subtitle, style }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 8px #eee",
      padding: "20px",
      textAlign: "center",
      minWidth: "180px",
      ...style,
    }}
  >
    <div style={{ fontSize: "1.1em", color: colours.highlight, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: "2.2em", fontWeight: 700, margin: "10px 0" }}>{value}</div>
    {subtitle && <div style={{ color: "#888", fontSize: "0.95em" }}>{subtitle}</div>}
  </div>
);
export default ALCard;