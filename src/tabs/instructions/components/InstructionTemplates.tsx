//
import React from "react";

interface InstructionTemplatesProps {
  templates: string[];
  onSelect: (template: string) => void;
}

const InstructionTemplates: React.FC<InstructionTemplatesProps> = ({
  templates,
  onSelect,
}) => {
  return (
    <div className="instruction-templates-popover">
      <div className="instruction-templates-list">
        {templates.length === 0 && (
          <div className="instruction-template-empty">No templates available</div>
        )}
        {templates.map((template, idx) => (
          <button
            key={idx}
            className="instruction-template-item"
            onClick={() => onSelect(template)}
          >
            {template.length > 40 ? template.slice(0, 40) + "..." : template}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InstructionTemplates;
