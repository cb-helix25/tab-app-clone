import React from "react";
import "./ALCard.css";

export interface ALCardProps {
  title: string;
  value: number;
  variant?: "standard" | "left" | "unpaid" | "unpaidLeft";
}

const variantColors: Record<string, string> = {
  standard: "#3690ce",
  left: "#28a745",
  unpaid: "#d35400",
  unpaidLeft: "#666"
};

const ALCard: React.FC<ALCardProps> = ({
  title,
  value,
  variant = "standard",
}) => {
  return (
    <div className={`al-metric-card al-metric-card-${variant}`}>
      <div className="al-metric-value" style={{ color: variantColors[variant] || "#333" }}>
        {value}
      </div>
      <div className="al-metric-title">{title}</div>
    </div>
  );
};

export default ALCard;