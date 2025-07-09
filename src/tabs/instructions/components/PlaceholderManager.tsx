//
import React, { useState, useRef } from "react";
// invisible change 2

interface PlaceholderManagerProps {
  value: string;
  onChange: (value: string) => void;
}

const PLACEHOLDER_REGEX = /\{\{(.*?)\}\}/g;

const PlaceholderManager: React.FC<PlaceholderManagerProps> = ({ value, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Split value into text and placeholders
  const parts = [] as { text: string; isPlaceholder: boolean; placeholder?: string }[];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(value))) {
    if (match.index > lastIndex) {
      parts.push({ text: value.slice(lastIndex, match.index), isPlaceholder: false });
    }
    parts.push({ text: match[0], isPlaceholder: true, placeholder: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) {
    parts.push({ text: value.slice(lastIndex), isPlaceholder: false });
  }

  const handlePlaceholderClick = (idx: number, placeholder: string) => {
    setEditingIndex(idx);
    setEditValue(placeholder);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditBlur = () => {
    if (editingIndex === null) return;
    // Replace the placeholder in value
    let placeholderCount = -1;
    const newValue = value.replace(PLACEHOLDER_REGEX, (match, p1) => {
      placeholderCount++;
      if (placeholderCount === editingIndex) {
        return `{{${editValue}}}`;
      }
      return match;
    });
    onChange(newValue);
    setEditingIndex(null);
  };

  return (
    <div className="placeholder-manager-editor">
      {parts.map((part, idx) =>
        part.isPlaceholder ? (
          editingIndex === idx ? (
            <input
              key={idx}
              ref={inputRef}
              className="placeholder-input"
              value={editValue}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  inputRef.current?.blur();
                }
              }}
            />
          ) : (
            <span
              key={idx}
              className="placeholder-chip"
              onClick={() => handlePlaceholderClick(idx, part.placeholder || "")}
              tabIndex={0}
              role="button"
            >
              {part.text}
            </span>
          )
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </div>
  );
};

export default PlaceholderManager;
